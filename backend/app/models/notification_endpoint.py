import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class NotificationEndpoint(Base, TimestampMixin):
    """A single browser/native destination for one authenticated user.

    Firebase is used only as a notification transport for Web. Android/iOS use
    Expo Push Tokens, with Android ultimately delivered through FCM and iOS
    through APNs by Expo Push Service.
    """

    __tablename__ = "notification_endpoints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    token: Mapped[str] = mapped_column(String(2048), nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("provider", "token", name="uq_notification_endpoint_provider_token"),
        Index("ix_notification_endpoints_user_active", "user_id", "is_active"),
        Index("ix_notification_endpoints_provider_platform", "provider", "platform"),
    )
