import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import NotificationAudience, NotificationType

if TYPE_CHECKING:
    from .user import User


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type"), nullable=False
    )
    audience: Mapped[NotificationAudience] = mapped_column(
        Enum(NotificationAudience, name="notification_audience"), nullable=False
    )
    sent_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    sent_by_user: Mapped["User"] = relationship(
        "User", back_populates="sent_notifications"
    )

    __table_args__ = (
        Index("ix_notifications_sent_by", "sent_by"),
        Index("ix_notifications_audience", "audience"),
        Index("ix_notifications_type", "notification_type"),
        Index("ix_notifications_sent_at", "sent_at"),
    )

    def __repr__(self) -> str:
        return f"<Notification id={self.id} type={self.notification_type} audience={self.audience}>"
