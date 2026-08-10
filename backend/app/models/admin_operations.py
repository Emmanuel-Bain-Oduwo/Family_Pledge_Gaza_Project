import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class DonorAdminProfile(Base, TimestampMixin):
    __tablename__ = "donor_admin_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    assigned_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    followup_status: Mapped[str] = mapped_column(String(30), nullable=False, default="none")
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_followup_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_contacted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])

    __table_args__ = (
        Index("ix_donor_admin_profiles_assigned", "assigned_admin_id"),
        Index("ix_donor_admin_profiles_followup", "followup_status", "next_followup_at"),
        Index("ix_donor_admin_profiles_priority", "priority"),
    )


class OutboundCampaign(Base, TimestampMixin):
    __tablename__ = "outbound_campaigns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by_admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    segment: Mapped[str] = mapped_column(String(60), nullable=False)
    content_category: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    channels: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued")
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    recipient_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    creator = relationship("User", foreign_keys=[created_by_admin_id])
    recipients = relationship("OutboundRecipient", back_populates="campaign", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_outbound_campaigns_status_schedule", "status", "scheduled_for"),
        Index("ix_outbound_campaigns_created_by", "created_by_admin_id"),
    )


class OutboundRecipient(Base):
    __tablename__ = "outbound_recipients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("outbound_campaigns.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    campaign = relationship("OutboundCampaign", back_populates="recipients")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("campaign_id", "user_id", "channel", name="uq_outbound_recipient_channel"),
        Index("ix_outbound_recipients_campaign_status", "campaign_id", "status"),
        Index("ix_outbound_recipients_user", "user_id"),
    )
