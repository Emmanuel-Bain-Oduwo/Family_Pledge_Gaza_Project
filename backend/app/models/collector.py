import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user import User


class Collector(Base, TimestampMixin):
    __tablename__ = "collectors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    collector_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    group_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="collector_profile")
    members: Mapped[List["CollectorMember"]] = relationship(
        "CollectorMember", back_populates="collector"
    )

    __table_args__ = (
        Index("ix_collectors_user_id", "user_id"),
        Index("ix_collectors_country", "country"),
    )

    def __repr__(self) -> str:
        return f"<Collector id={self.id} code={self.collector_code!r}>"


class CollectorMember(Base, TimestampMixin):
    __tablename__ = "collector_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    collector_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("collectors.id", ondelete="CASCADE"),
        nullable=False,
    )
    donor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    collector: Mapped["Collector"] = relationship("Collector", back_populates="members")
    donor_user: Mapped["User"] = relationship(
        "User", back_populates="collector_memberships"
    )

    __table_args__ = (
        UniqueConstraint("collector_id", "donor_user_id", name="uq_collector_member"),
        Index("ix_collector_members_collector_id", "collector_id"),
        Index("ix_collector_members_donor_user_id", "donor_user_id"),
    )

    def __repr__(self) -> str:
        return f"<CollectorMember collector={self.collector_id} donor={self.donor_user_id}>"
