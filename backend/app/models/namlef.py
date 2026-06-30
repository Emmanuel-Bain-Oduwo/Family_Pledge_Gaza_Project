import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import NamlefContentStatus, NamlefContentType

if TYPE_CHECKING:
    from .user import User


class NamlefContent(Base, TimestampMixin):
    __tablename__ = "namlef_content"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    speaker_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    speaker_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content_type: Mapped[NamlefContentType] = mapped_column(
        Enum(NamlefContentType, name="namlef_content_type"), nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[NamlefContentStatus] = mapped_column(
        Enum(NamlefContentStatus, name="namlef_content_status"),
        nullable=False,
        default=NamlefContentStatus.draft,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    # Relationships
    created_by_user: Mapped["User"] = relationship(
        "User", back_populates="created_namlef_content"
    )

    __table_args__ = (
        Index("ix_namlef_content_status", "status"),
        Index("ix_namlef_content_type", "content_type"),
        Index("ix_namlef_content_is_featured", "is_featured"),
        Index("ix_namlef_content_created_by", "created_by"),
    )

    def __repr__(self) -> str:
        return f"<NamlefContent id={self.id} type={self.content_type} status={self.status}>"
