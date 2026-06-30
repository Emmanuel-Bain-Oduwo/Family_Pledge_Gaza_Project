from datetime import datetime, timezone
from typing import List, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationSend


def send(db: Session, admin: User, data: NotificationSend) -> Notification:
    notification = Notification(
        title=data.title,
        body=data.body,
        notification_type=data.notification_type,
        audience=data.audience,
        sent_by=admin.id,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="notification.send",
            entity_type="notification",
            entity_id=None,
            metadata_={"title": data.title, "audience": data.audience.value},
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
