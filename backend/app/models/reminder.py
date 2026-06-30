import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import ReminderStatus, ReminderType

if TYPE_CHECKING:
    from .user import User


class DailyReminder(Base, TimestampMixin):
    __tablename__ = "daily_reminders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    reminder_type: Mapped[ReminderType] = mapped_column(
        Enum(ReminderType, name="reminder_type"), nullable=False
    )
    arabic_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    translation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    status: Mapped[ReminderStatus] = mapped_column(
        Enum(ReminderStatus, name="reminder_status"),
        nullable=False,
        default=ReminderStatus.draft,
    )
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    created_by_user: Mapped["User"] = relationship(
        "User", back_populates="created_reminders", foreign_keys=[created_by]
    )
    approved_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="approved_reminders", foreign_keys=[approved_by]
    )

    __table_args__ = (
        Index("ix_reminders_status", "status"),
        Index("ix_reminders_type", "reminder_type"),
        Index("ix_reminders_created_by", "created_by"),
        Index("ix_reminders_scheduled_for", "scheduled_for"),
    )

    def __repr__(self) -> str:
        return f"<DailyReminder id={self.id} type={self.reminder_type} status={self.status}>"
