from datetime import datetime, timezone
from typing import List, Tuple

import httpx
from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit import AdminAuditLog
from app.models.contribution import Contribution
from app.models.enums import ContributionStatus, NotificationAudience, UserRole
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationSend


def _audience_query(audience: NotificationAudience):
    query = select(User).where(
        User.deleted_at.is_(None),
        User.is_active.is_(True),
        User.push_token.is_not(None),
    )
    if audience == NotificationAudience.admins:
        return query.where(User.role == UserRole.admin)
    if audience == NotificationAudience.collectors:
        return query.where(User.role == UserRole.collector)
    if audience == NotificationAudience.confirmed_donors:
        return (
            query.join(Contribution, Contribution.user_id == User.id)
            .where(Contribution.status == ContributionStatus.confirmed)
            .distinct()
        )
    if audience == NotificationAudience.pending_donors:
        confirmed_users = select(Contribution.user_id).where(
            Contribution.status == ContributionStatus.confirmed
        )
        return query.where(User.role == UserRole.donor, User.id.not_in(confirmed_users))
    return query


def _send_expo_push(
    tokens: List[str], title: str, body: str, notification_type: str = "general"
) -> tuple[int, int]:
    if not tokens:
        return 0, 0
    channel_id = "emergency" if notification_type == "emergency" else (
        "reminders" if notification_type == "reminder" else "default"
    )
    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
            "channelId": channel_id,
            "data": {
                "screen": "/screens/notifications",
                "notification_type": notification_type,
            },
        }
        for token in tokens
    ]
    headers = {"Content-Type": "application/json"}
    if settings.EXPO_ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {settings.EXPO_ACCESS_TOKEN}"
    sent = 0
    failed = 0
    with httpx.Client(timeout=20) as client:
        for index in range(0, len(messages), 100):
            batch = messages[index : index + 100]
            try:
                response = client.post(
                    "https://exp.host/--/api/v2/push/send", json=batch, headers=headers
                )
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError):
                failed += len(batch)
                continue
            receipts = payload.get("data", []) if isinstance(payload, dict) else []
            sent += sum(1 for receipt in receipts if receipt.get("status") == "ok")
            failed += len(batch) - sum(
                1 for receipt in receipts if receipt.get("status") == "ok"
            )
    return sent, failed


def send(db: Session, admin: User, data: NotificationSend) -> Notification:
    users = list(db.scalars(_audience_query(data.audience)).all())
    tokens = [user.push_token for user in users if user.push_token]
    sent_count, failure_count = _send_expo_push(
        tokens, data.title, data.body, data.notification_type.value
    )
    notification = Notification(
        title=data.title,
        body=data.body,
        notification_type=data.notification_type,
        audience=data.audience,
        sent_by=admin.id,
        sent_at=datetime.now(timezone.utc),
        sent_count=sent_count,
        failure_count=failure_count,
    )
    db.add(notification)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="notification.send",
            entity_type="notification",
            entity_id=None,
            metadata_={
                "title": data.title,
                "audience": data.audience.value,
                "sent_count": sent_count,
                "failure_count": failure_count,
            },
        )
    )
    db.commit()
    db.refresh(notification)
    return notification


def list_notifications(
    db: Session, skip: int = 0, limit: int = 20
) -> Tuple[List[Notification], int]:
    base = select(Notification)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(
            base.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        ).all()
    )
    return items, total


def list_for_user(
    db: Session, user: User, skip: int = 0, limit: int = 50
) -> Tuple[List[Notification], int]:
    """Return persisted notifications whose audience includes this user."""
    audiences = [NotificationAudience.all_users]
    if user.role == UserRole.admin:
        audiences.append(NotificationAudience.admins)
    if user.role == UserRole.collector:
        audiences.append(NotificationAudience.collectors)

    audience_filter = Notification.audience.in_(audiences)
    if user.role == UserRole.donor:
        has_confirmed = exists(
            select(Contribution.id).where(
                Contribution.user_id == user.id,
                Contribution.status == ContributionStatus.confirmed,
            )
        )
        audience_filter = or_(
            audience_filter,
            and_(Notification.audience == NotificationAudience.confirmed_donors, has_confirmed),
            and_(Notification.audience == NotificationAudience.pending_donors, ~has_confirmed),
        )

    base = select(Notification).where(
        Notification.sent_at.is_not(None), audience_filter
    )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(
            base.order_by(Notification.sent_at.desc()).offset(skip).limit(limit)
        ).all()
    )
    return items, total
