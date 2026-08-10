from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification_endpoint import NotificationEndpoint
from app.models.user import User


def register_endpoint(
    db: Session,
    user: User,
    *,
    provider: str,
    platform: str,
    token: str,
    device_id: str | None = None,
) -> NotificationEndpoint:
    """Upsert a notification destination and attach it to the current user.

    Reassigning an endpoint is intentional: on a shared browser/device, a token
    can outlive a logout. The next authenticated registration must belong to the
    newly signed-in account rather than continuing to notify the previous user.
    """
    endpoint = db.scalar(
        select(NotificationEndpoint).where(
            NotificationEndpoint.provider == provider,
            NotificationEndpoint.token == token,
        )
    )
    if endpoint is None:
        endpoint = NotificationEndpoint(
            user_id=user.id,
            provider=provider,
            platform=platform,
            token=token,
            device_id=device_id,
            is_active=True,
            last_seen_at=datetime.now(timezone.utc),
        )
        db.add(endpoint)
    else:
        endpoint.user_id = user.id
        endpoint.platform = platform
        endpoint.device_id = device_id or endpoint.device_id
        endpoint.is_active = True
        endpoint.last_seen_at = datetime.now(timezone.utc)

    # Keep the old single-token field populated for old native app builds while
    # the multi-device endpoint table becomes the source of truth.
    if provider == "expo":
        user.push_token = token
        db.add(user)

    db.commit()
    db.refresh(endpoint)
    return endpoint


def deactivate_endpoint(db: Session, user: User, *, provider: str, token: str) -> bool:
    endpoint = db.scalar(
        select(NotificationEndpoint).where(
            NotificationEndpoint.user_id == user.id,
            NotificationEndpoint.provider == provider,
            NotificationEndpoint.token == token,
        )
    )
    if endpoint is None:
        return False

    endpoint.is_active = False
    endpoint.last_seen_at = datetime.now(timezone.utc)
    if provider == "expo" and user.push_token == token:
        user.push_token = None
        db.add(user)
    db.commit()
    return True
