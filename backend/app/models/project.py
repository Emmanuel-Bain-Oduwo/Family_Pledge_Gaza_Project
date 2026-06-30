import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Enum, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin
from .enums import ProjectCategory, ProjectStatus

if TYPE_CHECKING:
    from .user import User
    from .impact import ImpactCard


class Project(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[ProjectCategory] = mapped_column(
        Enum(ProjectCategory, name="project_category"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    raised_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    beneficiaries_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status"),
        nullable=False,
        default=ProjectStatus.upcoming,
    )
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    # Relationships
    created_by_user: Mapped["User"] = relationship(
        "User", back_populates="created_projects"
    )
    impact_cards: Mapped[List["ImpactCard"]] = relationship(
        "ImpactCard", back_populates="project"
    )

    __table_args__ = (
        Index("ix_projects_status", "status"),
        Index("ix_projects_category", "category"),
        Index("ix_projects_created_by", "created_by"),
        Index("ix_projects_deleted_at", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title!r} status={self.status}>"
