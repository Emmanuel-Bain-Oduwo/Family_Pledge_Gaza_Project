import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, Enum, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import PledgeStatus, PledgeType

if TYPE_CHECKING:
    from .user import User
    from .contribution import Contribution


class Pledge(Base, TimestampMixin):
    __tablename__ = "pledges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=10.00)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    pledge_type: Mapped[PledgeType] = mapped_column(
        Enum(PledgeType, name="pledge_type"), nullable=False, default=PledgeType.monthly
    )
    status: Mapped[PledgeStatus] = mapped_column(
        Enum(PledgeStatus, name="pledge_status"),
        nullable=False,
        default=PledgeStatus.active,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="pledges", foreign_keys=[user_id])
    contributions: Mapped[List["Contribution"]] = relationship(
        "Contribution", back_populates="pledge"
    )

    __table_args__ = (
        Index("ix_pledges_user_id", "user_id"),
        Index("ix_pledges_status", "status"),
        Index("ix_pledges_type", "pledge_type"),
    )

    def __repr__(self) -> str:
        return f"<Pledge id={self.id} user_id={self.user_id} status={self.status}>"
