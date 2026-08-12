from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.audit import AdminAuditLog
from app.models.campaign import Campaign
from app.models.collector import Collector
from app.models.contribution import Contribution
from app.models.enums import CampaignStatus, ContributionStatus, PledgeStatus, UserRole
from app.models.pledge import Pledge
from app.models.user import User
from app.models.tracked_contact import TrackedContact
from app.schemas.admin import AdminDonorOut, DashboardOut, TrackedContactInput, TrackedContactOut
from app.schemas.common import PaginatedResponse, make_page
from app.utils.pagination import offset_limit
from app.utils.validators import current_month

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

def _contact_out(c: TrackedContact):
    return TrackedContactOut(id=str(c.id), full_name=c.full_name, phone=c.phone, email=c.email,
        country=c.country, status=c.status, notes=c.notes, referral_code=c.referral_code,
        linked_user_id=str(c.linked_user_id) if c.linked_user_id else None,
        is_active=c.is_active, created_at=c.created_at.isoformat())

@router.get("/tracked-contacts", response_model=list[TrackedContactOut])
def list_tracked_contacts(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [_contact_out(c) for c in db.scalars(select(TrackedContact).where(TrackedContact.is_active.is_(True)).order_by(TrackedContact.created_at.desc()).limit(1000)).all()]

@router.post("/tracked-contacts", response_model=TrackedContactOut, status_code=201)
def create_tracked_contact(data: TrackedContactInput, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    values = data.model_dump()
    if values.get("referral_code"):
        values["referral_code"] = values["referral_code"].upper()
        if db.scalar(select(TrackedContact).where(TrackedContact.referral_code == values["referral_code"])):
            raise HTTPException(409, "Referral code is already in use")
    contact = TrackedContact(**values, created_by=admin.id)
    db.add(contact); db.commit(); db.refresh(contact)
    return _contact_out(contact)


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_donors = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor, User.deleted_at.is_(None)
        )
    ) or 0

    active_pledges = db.scalar(
        select(func.count(Pledge.id)).where(Pledge.status == PledgeStatus.active)
    ) or 0

    month = current_month()
    contributions_this_month = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.contribution_month == month
        )
    ) or 0

    pending_contributions = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.status == ContributionStatus.submitted
        )
    ) or 0

    active_campaigns = db.scalar(
        select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.active,
            Campaign.deleted_at.is_(None),
        )
    ) or 0

    total_campaign_raised = db.scalar(
        select(func.coalesce(func.sum(Campaign.raised_amount), 0)).where(
            Campaign.deleted_at.is_(None)
        )
    ) or 0.0

    # Contribution currency is normalized on new writes, but the production
    # ledger can contain older lower-case or padded values. Keep the dashboard
    # projection tolerant so every confirmed USD contribution is reflected.
    total_raised_tracked = db.scalar(
        select(func.coalesce(func.sum(Contribution.amount), 0)).where(
            Contribution.status == ContributionStatus.confirmed,
            func.upper(func.trim(Contribution.currency)) == "USD",
        )
    ) or 0.0

    collectors_count = db.scalar(select(func.count(Collector.id))) or 0

    recent_logs = db.scalars(
        select(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .limit(10)
    ).all()

    latest_activity = [
        {
            "id": str(log.id),
            "type": log.entity_type,
            "message": f"{log.action.replace('.', ' ').title()} — {log.entity_type}",
            "timestamp": log.created_at.isoformat(),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "admin_id": str(log.admin_id),
            "created_at": log.created_at.isoformat(),
        }
        for log in recent_logs
    ]

    return DashboardOut(
        total_donors=total_donors,
        active_pledges=active_pledges,
        contributions_this_month=contributions_this_month,
        pending_contributions=pending_contributions,
        active_campaigns=active_campaigns,
        total_campaign_raised=float(total_campaign_raised),
        total_raised_tracked=float(total_raised_tracked),
        collectors_count=collectors_count,
        latest_activity=latest_activity,
        recent_activity=latest_activity,
    )


@router.get("/donors", response_model=PaginatedResponse[AdminDonorOut])
def list_donors(
    search: str | None = Query(None),
    country: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    query = select(User).where(User.role == UserRole.donor, User.deleted_at.is_(None))
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            func.lower(User.full_name).like(pattern)
            | func.lower(User.phone).like(pattern)
            | func.lower(User.email).like(pattern)
        )
    if country:
        query = query.where(User.country == country)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    users = list(db.scalars(query.order_by(User.created_at.desc()).offset(skip).limit(limit)).all())
    user_ids = [u.id for u in users]
    month = current_month()
    active_pledges = {p.user_id: p for p in db.scalars(select(Pledge).where(Pledge.user_id.in_(user_ids), Pledge.status == PledgeStatus.active).order_by(Pledge.created_at.asc())).all()} if user_ids else {}
    contribution_counts = {(uid, s): count for uid, s, count in db.execute(select(Contribution.user_id, Contribution.status, func.count(Contribution.id)).where(Contribution.user_id.in_(user_ids), Contribution.contribution_month == month).group_by(Contribution.user_id, Contribution.status)).all()} if user_ids else {}
    collector_ids = set(db.scalars(select(Collector.user_id).where(Collector.user_id.in_(user_ids))).all()) if user_ids else set()
    rows: list[AdminDonorOut] = []
    for index, user in enumerate(users, start=skip + 1):
        active_pledge = active_pledges.get(user.id)
        confirmed_this_month = contribution_counts.get((user.id, ContributionStatus.confirmed), 0)
        submitted_this_month = contribution_counts.get((user.id, ContributionStatus.submitted), 0)
        if not active_pledge:
            pledge_status = "none"
        elif active_pledge.pledge_type.value == "free_participant":
            pledge_status = "free_participant"
        elif confirmed_this_month:
            pledge_status = "paid"
        elif submitted_this_month:
            pledge_status = "pending"
        else:
            pledge_status = "pending"
        if status and pledge_status != status:
            continue
        rows.append(AdminDonorOut(
            id=str(user.id),
            full_name=user.full_name,
            nickname=user.nickname,
            phone=user.phone,
            email=user.email,
            country=user.country,
            city=user.city,
            anonymous_publicly=user.anonymous_publicly,
            is_collector=user.id in collector_ids,
            collector_code=user.collector_code,
            pledge_status=pledge_status,
            donor_number=index,
            created_at=user.created_at.isoformat(),
        ))

    return make_page(rows, total, page, size)
