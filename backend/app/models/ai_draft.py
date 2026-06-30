import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import AiDraftStatus, AiDraftType

if TYPE_CHECKING:
    from .user import User


class AiDraft(Base, TimestampMixin):
    __tablename__ = "ai_drafts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    draft_type: Mapped[AiDraftType] = mapped_column(
        Enum(AiDraftType, name="ai_draft_type"), nullable=False
    )
    # Free-form context passed to the AI (topic, tone, campaign id, etc.)
    input_context: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    generated_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AiDraftStatus] = mapped_column(
        Enum(AiDraftStatus, name="ai_draft_status"),
        nullable=False,
        default=AiDraftStatus.draft,
    )
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    admin: Mapped["User"] = relationship(
        "User", back_populates="ai_drafts", foreign_keys=[admin_id]
    )
    approved_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="approved_ai_drafts", foreign_keys=[approved_by]
    )

    __table_args__ = (
        Index("ix_ai_drafts_admin_id", "admin_id"),
        Index("ix_ai_drafts_status", "status"),
        Index("ix_ai_drafts_type", "draft_type"),
        Index("ix_ai_drafts_approved_by", "approved_by"),
    )

    def __repr__(self) -> str:
        return f"<AiDraft id={self.id} type={self.draft_type} status={self.status}>"
