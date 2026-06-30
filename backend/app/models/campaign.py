import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin
from .enums import CampaignStatus, CampaignType

if TYPE_CHECKING:
    from .user import User
    from .contribution import Contribution


class Campaign(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    campaign_type: Mapped[CampaignType] = mapped_column(
        Enum(CampaignType, name="campaign_type"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    raised_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    donor_target: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    donor_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus, name="campaign_status"),
        nullable=False,
        default=CampaignStatus.draft,
    )
    starts_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ends_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    # Relationships
    created_by_user: Mapped["User"] = relationship(
        "User", back_populates="created_campaigns"
    )
    contributions: Mapped[List["Contribution"]] = relationship(
        "Contribution", back_populates="campaign"
    )

    __table_args__ = (
        Index("ix_campaigns_status", "status"),
        Index("ix_campaigns_type", "campaign_type"),
        Index("ix_campaigns_created_by", "created_by"),
        Index("ix_campaigns_starts_at", "starts_at"),
        Index("ix_campaigns_deleted_at", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<Campaign id={self.id} title={self.title!r} type={self.campaign_type}>"
