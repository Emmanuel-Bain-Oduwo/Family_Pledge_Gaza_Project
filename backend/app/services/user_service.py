import secrets
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.badge import Badge, UserBadge
from app.models.collector import Collector, CollectorMember
from app.models.contribution import Contribution
from app.models.engagement import EngagementEvent, EngagementGoal, FeatureRequest, PledgeCircle, PledgeCircleMember
from app.models.enums import UserRole
from app.models.media_asset import MediaAsset
from app.models.notification_endpoint import NotificationEndpoint
from app.models.tracked_contact import TrackedContact
from app.models.user import User
from app.schemas.user import AnonymousUpdateRequest, NotificationPreferenceRequest, UserUpdateRequest
from app.services.private_proof_service import delete_object as delete_private_proof


def _clean_optional(value: Optional[str], *, lowercase: bool = False) -> Optional[str]:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    return cleaned.lower() if lowercase else cleaned


def _belongs_to_another(candidate: Optional[User], user: User) -> bool:
    return bool(candidate and candidate.id != user.id)


def update_me(db: Session, user: User, data: UserUpdateRequest) -> User:
    updates = data.model_dump(exclude_unset=True)
    if "full_name" in updates:
        user.full_name = _clean_optional(updates["full_name"])
    if "nickname" in updates:
        user.nickname = _clean_optional(updates["nickname"])
    if "country" in updates:
        user.country = _clean_optional(updates["country"])
    if "city" in updates:
        user.city = _clean_optional(updates["city"])
    if "public_display_name" in updates:
        user.public_display_name = _clean_optional(updates["public_display_name"])
    next_email = user.email
    next_phone = user.phone
    if "email" in updates:
        next_email = _clean_optional(str(updates["email"]) if updates["email"] is not None else None, lowercase=True)
        if next_email:
            existing = db.scalar(select(User).where(User.email == next_email))
            if _belongs_to_another(existing, user):
                raise HTTPException(400, "Email already registered")
    if "phone" in updates:
        next_phone = _clean_optional(updates["phone"])
        if next_phone:
            existing = db.scalar(select(User).where(User.phone == next_phone))
            if _belongs_to_another(existing, user):
                raise HTTPException(400, "Phone number already registered")
    if not next_email and not next_phone:
        raise HTTPException(400, "Email or phone is required")
    if "email" in updates:
        user.email = next_email
    if "phone" in updates:
        user.phone = next_phone
    db.commit()
    db.refresh(user)
    return user


def update_anonymous(db: Session, user: User, data: AnonymousUpdateRequest) -> User:
    user.anonymous_publicly = data.anonymous_publicly
    if data.public_display_name is not None:
        user.public_display_name = data.public_display_name
    db.commit()
    db.refresh(user)
    return user


def update_notification_preferences(db: Session, user: User, data: NotificationPreferenceRequest) -> User:
    user.notification_daily = data.daily
    user.notification_friday = data.friday
    user.notification_campaigns = data.campaigns
    user.notification_emergency = data.emergency
    user.notification_quran = data.quran
    user.notification_hadith = data.hadith
    user.notification_dua = data.dua
    user.notification_motivation = data.motivation
    user.notification_impact = data.impact
    user.notification_humanitarian = data.humanitarian
    user.notification_onboarding_seen = data.onboarding_seen
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_badges(db: Session, user_id: UUID) -> List[dict]:
    rows = db.execute(
        select(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.awarded_at.desc())
    ).all()
    return [
        {
            "id": ub.id,
            "badge_id": badge.id,
            "name": badge.name,
            "description": badge.description,
            "icon_url": badge.icon_url,
            "awarded_at": ub.awarded_at,
        }
        for ub, badge in rows
    ]


def get_display_name(user: User) -> str:
    if user.anonymous_publicly:
        return user.public_display_name or user.nickname or "Anonymous donor"
    return user.full_name or user.nickname or "Anonymous donor"


def update_email_preferences(db: Session, user: User, weekly_email_opt_in: bool) -> User:
    user.weekly_email_opt_in = weekly_email_opt_in
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_account(db: Session, user: User, password: str) -> None:
    if user.role in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(403, "Administrator accounts must be offboarded through the admin governance process.")
    if not verify_password(password, user.password_hash):
        raise HTTPException(400, "Password is incorrect")

    contributions = list(db.scalars(select(Contribution).where(Contribution.user_id == user.id)).all())
    for contribution in contributions:
        if contribution.proof_object_key:
            delete_private_proof(contribution.proof_object_key)
            asset = db.scalar(select(MediaAsset).where(MediaAsset.object_key == contribution.proof_object_key))
            if asset:
                asset.status = "deleted"
                asset.deleted_at = datetime.now(timezone.utc)
        contribution.proof_object_key = None
        contribution.proof_image_url = None
        contribution.transaction_reference = None
        contribution.proof_expires_at = None

    # Remove all app-only engagement/recognition/community data. Accounting pledge
    # and contribution rows are the only donor-linked records intentionally retained.
    db.execute(delete(UserBadge).where(UserBadge.user_id == user.id))
    db.execute(delete(NotificationEndpoint).where(NotificationEndpoint.user_id == user.id))
    db.execute(delete(EngagementGoal).where(EngagementGoal.user_id == user.id))
    db.execute(delete(EngagementEvent).where(EngagementEvent.user_id == user.id))
    db.execute(delete(FeatureRequest).where(FeatureRequest.user_id == user.id))
    db.execute(delete(PledgeCircleMember).where(PledgeCircleMember.user_id == user.id))

    owned_circle_ids = list(db.scalars(select(PledgeCircle.id).where(PledgeCircle.owner_user_id == user.id)).all())
    if owned_circle_ids:
        db.execute(delete(PledgeCircleMember).where(PledgeCircleMember.circle_id.in_(owned_circle_ids)))
        db.execute(delete(PledgeCircle).where(PledgeCircle.id.in_(owned_circle_ids)))

    db.execute(delete(CollectorMember).where(CollectorMember.donor_user_id == user.id))
    collector = db.scalar(select(Collector).where(Collector.user_id == user.id))
    if collector:
        db.execute(delete(CollectorMember).where(CollectorMember.collector_id == collector.id))
        db.delete(collector)
    db.execute(delete(TrackedContact).where(TrackedContact.linked_user_id == user.id))

    now = datetime.now(timezone.utc)
    user.full_name = None
    user.nickname = None
    user.email = None
    user.phone = None
    user.country = None
    user.city = None
    user.push_token = None
    user.public_display_name = None
    user.collector_code = None
    user.anonymous_publicly = True
    user.weekly_email_opt_in = False
    for field in (
        "notification_daily",
        "notification_friday",
        "notification_campaigns",
        "notification_emergency",
        "notification_quran",
        "notification_hadith",
        "notification_dua",
        "notification_motivation",
        "notification_impact",
        "notification_humanitarian",
    ):
        setattr(user, field, False)
    user.notification_onboarding_seen = True
    user.email_unsubscribe_token = secrets.token_urlsafe(32)
    user.password_hash = hash_password(secrets.token_urlsafe(48))
    user.is_active = False
    user.deleted_at = now
    db.add(user)
    db.commit()
