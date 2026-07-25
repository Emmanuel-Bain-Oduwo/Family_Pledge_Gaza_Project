import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import (
    AiContentStatus,
    AiFollowupStatus,
    AiPriority,
    AiTaskRunStatus,
    AiTaskStatus,
    AiTaskType,
)


class AiTask(Base, TimestampMixin):
    __tablename__ = "ai_tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by_admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    task_type: Mapped[AiTaskType] = mapped_column(Enum(AiTaskType, name="ai_task_type"), nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)
    schedule_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    cron_expression: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    timezone: Mapped[str] = mapped_column(String(80), nullable=False, default="UTC")
    requires_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[AiTaskStatus] = mapped_column(Enum(AiTaskStatus, name="ai_task_status"), nullable=False, default=AiTaskStatus.draft)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_ai_tasks_created_by_admin_id", "created_by_admin_id"), Index("ix_ai_tasks_status", "status"), Index("ix_ai_tasks_task_type", "task_type"))


class AiTaskRun(Base):
    __tablename__ = "ai_task_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_tasks.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[AiTaskRunStatus] = mapped_column(Enum(AiTaskRunStatus, name="ai_task_run_status"), nullable=False, default=AiTaskRunStatus.planned)
    planned_action: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    generated_output: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    validation_result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    task = relationship("AiTask")
    __table_args__ = (Index("ix_ai_task_runs_task_id", "task_id"), Index("ix_ai_task_runs_status", "status"), Index("ix_ai_task_runs_created_at", "created_at"))


class AiGeneratedContent(Base, TimestampMixin):
    __tablename__ = "ai_generated_content"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_tasks.id", ondelete="SET NULL"), nullable=True)
    created_by_admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    content_type: Mapped[str] = mapped_column(String(80), nullable=False)
    channel: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AiContentStatus] = mapped_column(Enum(AiContentStatus, name="ai_content_status"), nullable=False, default=AiContentStatus.draft)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_ai_generated_content_created_by_admin_id", "created_by_admin_id"), Index("ix_ai_generated_content_status", "status"), Index("ix_ai_generated_content_task_id", "task_id"))


class AiFollowupSuggestion(Base, TimestampMixin):
    __tablename__ = "ai_followup_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    contribution_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("contributions.id", ondelete="SET NULL"), nullable=True)
    pledge_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("pledges.id", ondelete="SET NULL"), nullable=True)
    suggestion_type: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[AiPriority] = mapped_column(Enum(AiPriority, name="ai_priority"), nullable=False, default=AiPriority.medium)
    suggested_message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AiFollowupStatus] = mapped_column(Enum(AiFollowupStatus, name="ai_followup_status"), nullable=False, default=AiFollowupStatus.new)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
    contribution = relationship("Contribution")
    pledge = relationship("Pledge")
    __table_args__ = (Index("ix_ai_followup_suggestions_status", "status"), Index("ix_ai_followup_suggestions_user_id", "user_id"), Index("ix_ai_followup_suggestions_type", "suggestion_type"))
