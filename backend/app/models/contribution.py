import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import ContributionStatus

if TYPE_CHECKING:
    from .user import User
    from .pledge import Pledge
    from .campaign import Campaign


class Contribution(Base, TimestampMixin):
    __tablename__ = "contributions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    pledge_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pledges.id", ondelete="SET NULL"), nullable=True
    )
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    contribution_channel: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_link_used: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    proof_image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    status: Mapped[ContributionStatus] = mapped_column(
        Enum(ContributionStatus, name="contribution_status"),
        nullable=False,
        default=ContributionStatus.submitted,
    )
    # Format: YYYY-MM  e.g. "2025-06"
    contribution_month: Mapped[str] = mapped_column(String(7), nullable=False)
    admin_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confirmed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User", back_populates="contributions", foreign_keys=[user_id]
    )
    pledge: Mapped[Optional["Pledge"]] = relationship(
        "Pledge", back_populates="contributions"
    )
    campaign: Mapped[Optional["Campaign"]] = relationship(
        "Campaign", back_populates="contributions"
    )
    confirmed_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="confirmed_contributions", foreign_keys=[confirmed_by]
    )

    __table_args__ = (
        Index("ix_contributions_user_id", "user_id"),
        Index("ix_contributions_pledge_id", "pledge_id"),
        Index("ix_contributions_campaign_id", "campaign_id"),
        Index("ix_contributions_status", "status"),
        Index("ix_contributions_month", "contribution_month"),
        Index("ix_contributions_confirmed_by", "confirmed_by"),
        Index("ix_contributions_reference", "transaction_reference"),
    )

    def __repr__(self) -> str:
        return (
            f"<Contribution id={self.id} user_id={self.user_id} "
            f"month={self.contribution_month} status={self.status}>"
        )
