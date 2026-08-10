import csv
import io
import math
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.admin_operations import DonorAdminProfile, OutboundCampaign, OutboundRecipient
from app.models.ai_operations import AiFollowupSuggestion, AiTaskRun
from app.models.campaign import Campaign
from app.models.collector import Collector
from app.models.contribution import Contribution
from app.models.engagement import FeatureRequest
from app.models.enums import (
    AiFollowupStatus,
    AiTaskRunStatus,
    CampaignStatus,
    ContributionStatus,
    PledgeStatus,
    PledgeType,
    UserRole,
)
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.admin_operations import DonorAdminProfileUpdate, OutboundCampaignCreate
from app.services import ai_operations_service, notification_service
from app.services.communication_channels import send_email_reminder, send_whatsapp_reminder
from app.utils.validators import current_month


OPEN_FOLLOWUP_STATUSES = (AiFollowupStatus.new, AiFollowupStatus.approved)


def _month_start(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _base_donor_query():
    return select(User).where(
        User.role == UserRole.donor,
        User.is_active.is_(True),
        User.deleted_at.is_(None),
    )


def _apply_segment(query, segment: str):
    month = current_month()
    now = datetime.now(timezone.utc)
    active_pledge = exists(select(Pledge.id).where(
        Pledge.user_id == User.id,
        Pledge.status == PledgeStatus.active,
    ))
    confirmed_month = exists(select(Contribution.id).where(
        Contribution.user_id == User.id,
        Contribution.contribution_month == month,
        Contribution.status == ContributionStatus.confirmed,
    ))
    pending_month = exists(select(Contribution.id).where(
        Contribution.user_id == User.id,
        Contribution.contribution_month == month,
        Contribution.status.in_([ContributionStatus.submitted, ContributionStatus.needs_follow_up]),
    ))
    recent_contribution = exists(select(Contribution.id).where(
        Contribution.user_id == User.id,
        Contribution.created_at >= now - timedelta(days=30),
    ))
    if segment == "active_pledges":
        return query.where(active_pledge)
    if segment == "missing_this_month":
        return query.where(active_pledge, ~confirmed_month, ~pending_month)
    if segment == "pending_review":
        return query.where(pending_month)
    if segment == "confirmed_this_month":
        return query.where(confirmed_month)
    if segment == "inactive_30_days":
        return query.where(~recent_contribution, User.created_at < now - timedelta(days=30))
    if segment == "new_this_month":
        return query.where(User.created_at >= _month_start(now))
    if segment == "collectors":
        return query.where(exists(select(Collector.id).where(Collector.user_id == User.id)))
    return query


def segment_users(db: Session, segment: str) -> list[User]:
    if segment not in {
        "all_donors", "active_pledges", "missing_this_month", "pending_review",
        "confirmed_this_month", "inactive_30_days", "new_this_month", "collectors",
    }:
        raise HTTPException(400, "Unsupported donor segment")
    query = _apply_segment(_base_donor_query(), segment)
    return list(db.scalars(query.order_by(User.created_at.desc())).all())


def segment_count(db: Session, segment: str) -> int:
    query = _apply_segment(_base_donor_query(), segment)
    return int(db.scalar(select(func.count()).select_from(query.subquery())) or 0)


def _consecutive_months(months: list[str]) -> int:
    parsed = []
    for value in months:
        try:
            year, month = [int(x) for x in value.split("-", 1)]
            parsed.append(year * 12 + month)
        except Exception:
            continue
    if not parsed:
        return 0
    distinct = sorted(set(parsed), reverse=True)
    streak = 1
    for left, right in zip(distinct, distinct[1:]):
        if left - right == 1:
            streak += 1
        else:
            break
    return streak


def list_donors(
    db: Session,
    *,
    page: int,
    size: int,
    search: str | None = None,
    country: str | None = None,
    segment: str = "all_donors",
    priority: str | None = None,
    followup_status: str | None = None,
    assigned_admin_id: UUID | None = None,
):
    query = _apply_segment(_base_donor_query(), segment).outerjoin(
        DonorAdminProfile, DonorAdminProfile.user_id == User.id
    )
    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.where(or_(
            func.lower(func.coalesce(User.full_name, "")).like(pattern),
            func.lower(func.coalesce(User.nickname, "")).like(pattern),
            func.lower(func.coalesce(User.email, "")).like(pattern),
            func.lower(func.coalesce(User.phone, "")).like(pattern),
        ))
    if country:
        query = query.where(User.country == country)
    if priority:
        query = query.where(DonorAdminProfile.priority == priority)
    if followup_status:
        if followup_status == "none":
            query = query.where(or_(DonorAdminProfile.followup_status.is_(None), DonorAdminProfile.followup_status == "none"))
        else:
            query = query.where(DonorAdminProfile.followup_status == followup_status)
    if assigned_admin_id:
        query = query.where(DonorAdminProfile.assigned_admin_id == assigned_admin_id)

    total = int(db.scalar(select(func.count()).select_from(query.subquery())) or 0)
    users = list(db.scalars(
        query.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size)
    ).all())
    if not users:
        return {"items": [], "total": total, "page": page, "size": size, "pages": max(1, math.ceil(total / size))}

    ids = [u.id for u in users]
    month = current_month()
    profiles = {p.user_id: p for p in db.scalars(select(DonorAdminProfile).where(DonorAdminProfile.user_id.in_(ids))).all()}
    active_pledges = {}
    for pledge in db.scalars(select(Pledge).where(Pledge.user_id.in_(ids), Pledge.status == PledgeStatus.active).order_by(Pledge.created_at.asc())).all():
        active_pledges.setdefault(pledge.user_id, pledge)
    month_rows = db.execute(
        select(Contribution.user_id, Contribution.status, func.count(Contribution.id))
        .where(Contribution.user_id.in_(ids), Contribution.contribution_month == month)
        .group_by(Contribution.user_id, Contribution.status)
    ).all()
    month_status = {(uid, status): int(count) for uid, status, count in month_rows}
    last_rows = db.execute(
        select(Contribution.user_id, func.max(Contribution.created_at))
        .where(Contribution.user_id.in_(ids))
        .group_by(Contribution.user_id)
    ).all()
    last_dates = {uid: value for uid, value in last_rows}
    streak_rows = db.execute(
        select(Contribution.user_id, Contribution.contribution_month)
        .where(
            Contribution.user_id.in_(ids),
            Contribution.status == ContributionStatus.confirmed,
        )
        .distinct()
    ).all()
    streak_map: dict[UUID, list[str]] = {}
    for uid, contribution_month in streak_rows:
        streak_map.setdefault(uid, []).append(contribution_month)

    items = []
    start = (page - 1) * size
    for index, user in enumerate(users, start=start + 1):
        pledge = active_pledges.get(user.id)
        confirmed = month_status.get((user.id, ContributionStatus.confirmed), 0)
        submitted = month_status.get((user.id, ContributionStatus.submitted), 0)
        followup = month_status.get((user.id, ContributionStatus.needs_follow_up), 0)
        if not pledge:
            pledge_status = "none"
        elif pledge.pledge_type == PledgeType.free_participant:
            pledge_status = "free_participant"
        elif confirmed:
            pledge_status = "paid"
        elif followup:
            pledge_status = "needs_follow_up"
        elif submitted:
            pledge_status = "pending"
        else:
            pledge_status = "missed"
        contribution_status = "confirmed" if confirmed else "needs_follow_up" if followup else "submitted" if submitted else "none"
        profile = profiles.get(user.id)
        items.append({
            "id": user.id,
            "donor_number": index,
            "full_name": user.full_name,
            "nickname": user.nickname,
            "country": user.country,
            "city": user.city,
            "joined_at": user.created_at,
            "pledge_status": pledge_status,
            "contribution_status_this_month": contribution_status,
            "last_contribution_at": last_dates.get(user.id),
            "months_consistent": _consecutive_months(streak_map.get(user.id, [])),
            "priority": profile.priority if profile else "normal",
            "followup_status": profile.followup_status if profile else "none",
            "next_followup_at": profile.next_followup_at if profile else None,
            "last_contacted_at": profile.last_contacted_at if profile else None,
            "assigned_admin_id": profile.assigned_admin_id if profile else None,
            "tags": list(profile.tags or []) if profile else [],
            "email_available": bool(user.email),
            "phone_available": bool(user.phone),
            "email_reminders_opt_in": bool(user.email_reminders_opt_in),
            "whatsapp_reminders_opt_in": bool(user.whatsapp_reminders_opt_in),
        })
    return {"items": items, "total": total, "page": page, "size": size, "pages": max(1, math.ceil(total / size))}


def update_donor_profile(db: Session, donor_id: UUID, changes, admin: User):
    donor = db.scalar(select(User).where(
        User.id == donor_id,
        User.role == UserRole.donor,
        User.deleted_at.is_(None),
    ))
    if not donor:
        raise HTTPException(404, "Donor not found")
    profile = db.get(DonorAdminProfile, donor_id)
    if not profile:
        profile = DonorAdminProfile(user_id=donor_id)
        db.add(profile)
    values = changes.model_dump(exclude_unset=True)
    for key, value in values.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def donor_detail(db: Session, donor_id: UUID, donor_number: int = 0):
    donor = db.scalar(select(User).where(User.id == donor_id, User.role == UserRole.donor, User.deleted_at.is_(None)))
    if not donor:
        raise HTTPException(404, "Donor not found")
    page_data = list_donors(db, page=1, size=1, search=str(donor.email or donor.phone or donor.id), segment="all_donors")
    row = page_data["items"][0] if page_data["items"] else None
    if row is None:
        raise HTTPException(404, "Donor operations record not found")
    row["donor_number"] = donor_number or row["donor_number"]
    profile = db.get(DonorAdminProfile, donor.id)
    pledge = db.scalar(select(Pledge).where(Pledge.user_id == donor.id, Pledge.status == PledgeStatus.active).order_by(Pledge.created_at.desc()).limit(1))
    contributions = list(db.scalars(select(Contribution).where(Contribution.user_id == donor.id).order_by(Contribution.created_at.desc()).limit(12)).all())
    followups = list(db.scalars(select(AiFollowupSuggestion).where(
        AiFollowupSuggestion.user_id == donor.id,
        AiFollowupSuggestion.status.in_(OPEN_FOLLOWUP_STATUSES),
    ).order_by(AiFollowupSuggestion.created_at.desc()).limit(10)).all())
    return {
        "donor": row,
        "email": donor.email,
        "phone": donor.phone,
        "internal_notes": profile.internal_notes if profile else None,
        "active_pledge": None if not pledge else {
            "id": str(pledge.id),
            "type": pledge.pledge_type.value,
            "amount": float(pledge.amount) if pledge.amount is not None else None,
            "currency": pledge.currency,
            "status": pledge.status.value,
            "start_date": pledge.start_date.isoformat() if pledge.start_date else None,
        },
        "recent_contributions": [{
            "id": str(c.id),
            "month": c.contribution_month,
            "amount": float(c.amount),
            "currency": c.currency,
            "status": c.status.value,
            "created_at": c.created_at.isoformat(),
        } for c in contributions],
        "open_followups": [{
            "id": str(f.id),
            "type": f.suggestion_type,
            "reason": f.reason,
            "priority": f.priority.value,
            "status": f.status.value,
            "suggested_message": f.suggested_message,
            "snoozed_until": f.snoozed_until.isoformat() if f.snoozed_until else None,
        } for f in followups],
    }


def command_center(db: Session):
    month = current_month()
    now = datetime.now(timezone.utc)
    pending_review = int(db.scalar(select(func.count(Contribution.id)).where(Contribution.status == ContributionStatus.submitted)) or 0)
    needs_follow_up = int(db.scalar(select(func.count(Contribution.id)).where(Contribution.status == ContributionStatus.needs_follow_up)) or 0)
    confirmed_this_month = int(db.scalar(select(func.count(Contribution.id)).where(
        Contribution.status == ContributionStatus.confirmed,
        Contribution.contribution_month == month,
    )) or 0)
    open_followups = int(db.scalar(select(func.count(AiFollowupSuggestion.id)).where(AiFollowupSuggestion.status.in_(OPEN_FOLLOWUP_STATUSES))) or 0)
    due_profile_followups = int(db.scalar(select(func.count(DonorAdminProfile.user_id)).where(
        DonorAdminProfile.next_followup_at.is_not(None),
        DonorAdminProfile.next_followup_at <= now,
        DonorAdminProfile.followup_status.not_in(["resolved", "none"]),
    )) or 0)
    scheduled_messages = int(db.scalar(select(func.count(OutboundCampaign.id)).where(OutboundCampaign.status.in_(["queued", "processing"]))) or 0)
    ai_waiting = int(db.scalar(select(func.count(AiTaskRun.id)).where(AiTaskRun.status == AiTaskRunStatus.waiting_approval)) or 0)
    active_campaigns = int(db.scalar(select(func.count(Campaign.id)).where(Campaign.status == CampaignStatus.active, Campaign.deleted_at.is_(None))) or 0)
    feature_requests_new = int(db.scalar(select(func.count(FeatureRequest.id)).where(FeatureRequest.status == "new")) or 0)
    segments = {name: segment_count(db, name) for name in (
        "all_donors", "active_pledges", "missing_this_month", "pending_review",
        "confirmed_this_month", "inactive_30_days", "new_this_month", "collectors",
    )}
    return {
        "total_donors": segments["all_donors"],
        "active_pledges": segments["active_pledges"],
        "missing_this_month": segments["missing_this_month"],
        "pending_review": pending_review,
        "needs_follow_up": needs_follow_up,
        "confirmed_this_month": confirmed_this_month,
        "inactive_30_days": segments["inactive_30_days"],
        "new_this_month": segments["new_this_month"],
        "open_followup_cases": open_followups,
        "scheduled_messages": scheduled_messages,
        "ai_outputs_waiting": ai_waiting,
        "active_campaigns": active_campaigns,
        "feature_requests_new": feature_requests_new,
        "due_followups_today": due_profile_followups,
        "segment_counts": segments,
    }


def sync_followups(db: Session) -> int:
    generated = ai_operations_service.find_followup_suggestions(db)
    created = 0
    for item in generated:
        query = select(AiFollowupSuggestion).where(
            AiFollowupSuggestion.suggestion_type == item["type"],
            AiFollowupSuggestion.status.in_(OPEN_FOLLOWUP_STATUSES),
        )
        if item.get("user_id") is not None:
            query = query.where(AiFollowupSuggestion.user_id == item["user_id"])
        if item.get("related_contribution_id") is not None:
            query = query.where(AiFollowupSuggestion.contribution_id == item["related_contribution_id"])
        if item.get("related_pledge_id") is not None:
            query = query.where(AiFollowupSuggestion.pledge_id == item["related_pledge_id"])
        existing = db.scalar(query.limit(1))
        if existing:
            existing.reason = item["reason"]
            existing.suggested_message = item["suggested_message"]
            existing.priority = item["priority"]
            continue
        db.add(AiFollowupSuggestion(
            user_id=item.get("user_id"),
            contribution_id=item.get("related_contribution_id"),
            pledge_id=item.get("related_pledge_id"),
            suggestion_type=item["type"],
            reason=item["reason"],
            priority=item["priority"],
            suggested_message=item["suggested_message"],
            status=AiFollowupStatus.new,
        ))
        created += 1
    db.commit()
    return created


def list_followups(db: Session, *, assigned_admin_id: UUID | None = None, priority: str | None = None):
    now = datetime.now(timezone.utc)
    query = select(AiFollowupSuggestion).where(
        AiFollowupSuggestion.status.in_(OPEN_FOLLOWUP_STATUSES),
        or_(AiFollowupSuggestion.snoozed_until.is_(None), AiFollowupSuggestion.snoozed_until <= now),
    )
    if assigned_admin_id:
        query = query.where(AiFollowupSuggestion.assigned_admin_id == assigned_admin_id)
    if priority:
        query = query.where(AiFollowupSuggestion.priority == priority)
    items = list(db.scalars(query.order_by(AiFollowupSuggestion.created_at.desc()).limit(500)).all())
    return [{
        "id": str(item.id),
        "user_id": str(item.user_id) if item.user_id else None,
        "donor_name": item.user.full_name if item.user else None,
        "type": item.suggestion_type,
        "reason": item.reason,
        "priority": item.priority.value,
        "suggested_message": item.suggested_message,
        "status": item.status.value,
        "assigned_admin_id": str(item.assigned_admin_id) if item.assigned_admin_id else None,
        "last_contacted_at": item.last_contacted_at.isoformat() if item.last_contacted_at else None,
    } for item in items]


def update_followup_state(db: Session, followup_id: UUID, data, admin: User):
    item = db.get(AiFollowupSuggestion, followup_id)
    if not item:
        raise HTTPException(404, "Follow-up case not found")
    now = datetime.now(timezone.utc)
    if data.action == "assign":
        item.assigned_admin_id = data.assigned_admin_id or admin.id
    elif data.action == "snooze":
        if not data.snoozed_until or data.snoozed_until <= now:
            raise HTTPException(400, "Choose a future snooze time")
        item.snoozed_until = data.snoozed_until
    elif data.action == "mark_contacted":
        item.last_contacted_at = now
        item.contact_channel = data.channel
        item.status = AiFollowupStatus.approved
        if item.user_id:
            profile = db.get(DonorAdminProfile, item.user_id) or DonorAdminProfile(user_id=item.user_id)
            profile.last_contacted_at = now
            profile.followup_status = "contacted"
            db.add(profile)
    elif data.action == "resolve":
        item.resolved_at = now
        item.status = AiFollowupStatus.sent
    elif data.action == "dismiss":
        item.resolved_at = now
        item.status = AiFollowupStatus.dismissed
    db.commit()
    db.refresh(item)
    return item


def communication_preview(db: Session, segment: str, content_category: str | None = "pledge"):
    users = segment_users(db, segment)
    app_eligible = sum(1 for user in users if notification_service._push_preference_allows(user, notification_service.NotificationType.reminder, content_category))
    return {
        "segment": segment,
        "total_users": len(users),
        "app_eligible": app_eligible,
        "email_eligible": sum(1 for user in users if user.email and user.email_reminders_opt_in),
        "whatsapp_eligible": sum(1 for user in users if user.phone and user.whatsapp_reminders_opt_in),
    }


def queue_communication(db: Session, admin: User, data: OutboundCampaignCreate) -> OutboundCampaign:
    users = segment_users(db, data.segment)
    campaign = OutboundCampaign(
        created_by_admin_id=admin.id,
        title=data.title.strip(),
        body=data.body.strip(),
        segment=data.segment,
        content_category=data.content_category,
        channels=data.channels,
        status="queued",
        scheduled_for=data.scheduled_for,
    )
    db.add(campaign)
    db.flush()
    recipients = 0
    for user in users:
        if "app" in data.channels and notification_service._push_preference_allows(
            user, notification_service.NotificationType.reminder, data.content_category
        ):
            db.add(OutboundRecipient(campaign_id=campaign.id, user_id=user.id, channel="app"))
            recipients += 1
        if "email" in data.channels and user.email and user.email_reminders_opt_in:
            db.add(OutboundRecipient(campaign_id=campaign.id, user_id=user.id, channel="email"))
            recipients += 1
        if "whatsapp" in data.channels and user.phone and user.whatsapp_reminders_opt_in:
            db.add(OutboundRecipient(campaign_id=campaign.id, user_id=user.id, channel="whatsapp"))
            recipients += 1
    campaign.recipient_count = recipients
    if recipients == 0:
        campaign.status = "completed"
    db.commit()
    db.refresh(campaign)
    return campaign


def list_communications(db: Session, limit: int = 100):
    return list(db.scalars(select(OutboundCampaign).order_by(OutboundCampaign.created_at.desc()).limit(limit)).all())


def _send_app(db: Session, user: User, campaign: OutboundCampaign) -> tuple[bool, str | None]:
    expo, web = notification_service._resolve_delivery_tokens(db, [user])
    expo_sent, expo_failed = notification_service._send_expo_push(
        expo, campaign.title, campaign.body, "reminder", campaign.content_category
    )
    web_sent, web_failed = notification_service._send_fcm_web(
        web, campaign.title, campaign.body, "reminder", campaign.content_category
    )
    if expo_sent + web_sent > 0:
        return True, None
    if not expo and not web:
        return False, "No active app/browser notification endpoint"
    return False, f"Push delivery failed ({expo_failed + web_failed})"


def process_campaign_batch(db: Session, campaign: OutboundCampaign, batch_size: int | None = None) -> int:
    if campaign.status == "completed":
        return 0
    now = datetime.now(timezone.utc)
    if campaign.scheduled_for and campaign.scheduled_for > now:
        return 0
    size = batch_size or settings.OUTBOUND_WORKER_BATCH_SIZE
    campaign.status = "processing"
    db.commit()
    recipients = list(db.scalars(
        select(OutboundRecipient)
        .where(OutboundRecipient.campaign_id == campaign.id, OutboundRecipient.status == "queued")
        .order_by(OutboundRecipient.created_at.asc())
        .limit(size)
    ).all())
    for recipient in recipients:
        user = db.get(User, recipient.user_id)
        if not user or not user.is_active or user.deleted_at is not None:
            ok, error = False, "Recipient account is unavailable"
        elif recipient.channel == "app":
            ok, error = _send_app(db, user, campaign)
        elif recipient.channel == "email":
            ok, error = send_email_reminder(user, campaign.title, campaign.body)
        elif recipient.channel == "whatsapp":
            ok, error = send_whatsapp_reminder(user, campaign.title, campaign.body)
        else:
            ok, error = False, "Unsupported channel"
        recipient.status = "sent" if ok else "failed"
        recipient.error_message = error
        recipient.sent_at = now if ok else None
        if ok:
            profile = db.get(DonorAdminProfile, user.id) or DonorAdminProfile(user_id=user.id)
            profile.last_contacted_at = now
            profile.followup_status = "contacted"
            db.add(profile)
    db.commit()
    remaining = int(db.scalar(select(func.count(OutboundRecipient.id)).where(
        OutboundRecipient.campaign_id == campaign.id,
        OutboundRecipient.status == "queued",
    )) or 0)
    campaign.sent_count = int(db.scalar(select(func.count(OutboundRecipient.id)).where(
        OutboundRecipient.campaign_id == campaign.id,
        OutboundRecipient.status == "sent",
    )) or 0)
    campaign.failed_count = int(db.scalar(select(func.count(OutboundRecipient.id)).where(
        OutboundRecipient.campaign_id == campaign.id,
        OutboundRecipient.status == "failed",
    )) or 0)
    campaign.status = "completed" if remaining == 0 else "processing"
    db.commit()
    return len(recipients)


def process_due_communications(db: Session) -> int:
    now = datetime.now(timezone.utc)
    campaigns = list(db.scalars(select(OutboundCampaign).where(
        OutboundCampaign.status.in_(["queued", "processing"]),
        or_(OutboundCampaign.scheduled_for.is_(None), OutboundCampaign.scheduled_for <= now),
    ).order_by(OutboundCampaign.created_at.asc()).limit(10)).all())
    processed = 0
    for campaign in campaigns:
        processed += process_campaign_batch(db, campaign)
    return processed


def export_donors_csv(db: Session, segment: str = "all_donors") -> str:
    users = segment_users(db, segment)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "donor_id", "full_name", "country", "city", "joined_at", "email", "phone",
        "email_reminders_opt_in", "whatsapp_reminders_opt_in", "priority", "followup_status",
        "next_followup_at", "last_contacted_at", "tags",
    ])
    profiles = {p.user_id: p for p in db.scalars(select(DonorAdminProfile).where(DonorAdminProfile.user_id.in_([u.id for u in users]))).all()} if users else {}
    for user in users:
        profile = profiles.get(user.id)
        writer.writerow([
            str(user.id), user.full_name or "", user.country or "", user.city or "", user.created_at.isoformat(),
            user.email or "", user.phone or "", bool(user.email_reminders_opt_in), bool(user.whatsapp_reminders_opt_in),
            profile.priority if profile else "normal", profile.followup_status if profile else "none",
            profile.next_followup_at.isoformat() if profile and profile.next_followup_at else "",
            profile.last_contacted_at.isoformat() if profile and profile.last_contacted_at else "",
            ", ".join(profile.tags or []) if profile else "",
        ])
    return buffer.getvalue()
