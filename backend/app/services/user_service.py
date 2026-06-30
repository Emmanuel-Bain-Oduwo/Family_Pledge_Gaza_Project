from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.badge import Badge, UserBadge
from app.models.user import User
from app.schemas.user import AnonymousUpdateRequest, UserUpdateRequest


def update_me(db: Session, user: User, data: UserUpdateRequest) -> User:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
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
