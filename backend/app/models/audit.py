import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .user import User


class AdminAuditLog(Base):
    """Immutable audit trail for admin actions. No updates, no soft-delete."""

    __tablename__ = "admin_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    # e.g. "contribution.confirm", "campaign.create", "user.deactivate"
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g. "contribution", "campaign", "user"
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # UUID of the affected record (nullable for bulk/global actions)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    # Extra info: old/new values, IP, user-agent, etc.
    metadata_: Mapped[Optional[dict]] = mapped_column(
        "metadata", JSONB, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    admin: Mapped["User"] = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_admin_id", "admin_id"),
        Index("ix_audit_logs_entity_type", "entity_type"),
        Index("ix_audit_logs_entity_id", "entity_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<AdminAuditLog admin={self.admin_id} action={self.action!r}>"
