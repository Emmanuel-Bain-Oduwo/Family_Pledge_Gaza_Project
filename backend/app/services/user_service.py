from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.badge import Badge, UserBadge
from app.models.user import User
from app.schemas.user import AnonymousUpdateRequest, UserUpdateRequest


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


def get_badges(db: Session, user_id: UUID) -> List[dict]:
    rows = db.execute(
        select(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.awarded_at.desc())
    ).all()
    result = []
    for ub, badge in rows:
        result.append(
            {
                "id": ub.id,
                "badge_id": badge.id,
                "name": badge.name,
                "description": badge.description,
                "icon_url": badge.icon_url,
                "awarded_at": ub.awarded_at,
            }
        )
    return result


def get_display_name(user: User) -> str:
    if user.anonymous_publicly:
        return user.public_display_name or user.nickname or "Anonymous donor"
    return user.full_name or user.nickname or "Anonymous donor"


def update_email_preferences(
    db: Session, user: User, weekly_email_opt_in: bool
) -> User:
    user.weekly_email_opt_in = weekly_email_opt_in
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
