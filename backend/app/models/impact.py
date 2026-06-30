import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user import User
    from .project import Project


class ImpactCard(Base, TimestampMixin):
    __tablename__ = "impact_cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    story: Mapped[str] = mapped_column(Text, nullable=False)
    beneficiaries_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    # Relationships
    project: Mapped[Optional["Project"]] = relationship(
        "Project", back_populates="impact_cards"
    )
    created_by_user: Mapped["User"] = relationship(
        "User", back_populates="created_impact_cards"
    )

    __table_args__ = (
        Index("ix_impact_cards_project_id", "project_id"),
        Index("ix_impact_cards_created_by", "created_by"),
        Index("ix_impact_cards_completed_at", "completed_at"),
    )

    def __repr__(self) -> str:
        return f"<ImpactCard id={self.id} title={self.title!r}>"
