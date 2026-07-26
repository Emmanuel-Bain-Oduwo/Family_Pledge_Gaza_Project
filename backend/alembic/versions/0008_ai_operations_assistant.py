"""AI operations assistant foundation

Revision ID: 0008
Revises: 0007_add_password_reset
Create Date: 2026-07-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0008"
down_revision: Union[str, None] = "0007_add_password_reset"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _create_enum(name: str, values: list[str]):
    bind = op.get_bind()
    enum = postgresql.ENUM(*values, name=name, create_type=False)
    enum.create(bind, checkfirst=True)
    return enum


def upgrade() -> None:
    task_type = _create_enum("ai_task_type", ["content_generation", "donor_follow_up", "contribution_review_summary", "campaign_summary", "reminder_generation", "weekly_report", "custom_admin_task"])
    task_status = _create_enum("ai_task_status", ["draft", "active", "paused", "cancelled"])
    run_status = _create_enum("ai_task_run_status", ["planned", "validated", "waiting_approval", "executed", "failed", "cancelled"])
    content_status = _create_enum("ai_content_status", ["draft", "pending_approval", "approved", "scheduled", "published", "rejected"])
    followup_status = _create_enum("ai_followup_status", ["new", "approved", "sent", "dismissed"])
    priority = _create_enum("ai_priority", ["low", "medium", "high", "urgent"])

    op.create_table("ai_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_by_admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("task_type", task_type, nullable=False),
        sa.Column("instruction", sa.Text(), nullable=False),
        sa.Column("schedule_type", sa.String(50), nullable=True),
        sa.Column("cron_expression", sa.String(120), nullable=True),
        sa.Column("timezone", sa.String(80), nullable=False, server_default="UTC"),
        sa.Column("requires_approval", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("status", task_status, nullable=False, server_default="draft"),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table("ai_task_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ai_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", run_status, nullable=False, server_default="planned"),
        sa.Column("planned_action", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("generated_output", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("validation_result", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table("ai_generated_content",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ai_tasks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_by_admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("content_type", sa.String(80), nullable=False),
        sa.Column("channel", sa.String(80), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", content_status, nullable=False, server_default="pending_approval"),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table("ai_followup_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("contribution_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contributions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pledge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pledges.id", ondelete="SET NULL"), nullable=True),
        sa.Column("suggestion_type", sa.String(100), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("priority", priority, nullable=False, server_default="medium"),
        sa.Column("suggested_message", sa.Text(), nullable=False),
        sa.Column("status", followup_status, nullable=False, server_default="new"),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for table, cols in {"ai_tasks": ["created_by_admin_id", "status", "task_type"], "ai_task_runs": ["task_id", "status", "created_at"], "ai_generated_content": ["created_by_admin_id", "status", "task_id"], "ai_followup_suggestions": ["status", "user_id", "suggestion_type"]}.items():
        for col in cols:
            op.create_index(f"ix_{table}_{col}", table, [col])


def downgrade() -> None:
    for table, cols in {"ai_followup_suggestions": ["status", "user_id", "suggestion_type"], "ai_generated_content": ["created_by_admin_id", "status", "task_id"], "ai_task_runs": ["task_id", "status", "created_at"], "ai_tasks": ["created_by_admin_id", "status", "task_type"]}.items():
        for col in cols:
            op.drop_index(f"ix_{table}_{col}", table_name=table)
    op.drop_table("ai_followup_suggestions")
    op.drop_table("ai_generated_content")
    op.drop_table("ai_task_runs")
    op.drop_table("ai_tasks")
    bind = op.get_bind()
    for enum_name in ["ai_followup_status", "ai_content_status", "ai_task_run_status", "ai_task_status", "ai_task_type", "ai_priority"]:
        postgresql.ENUM(name=enum_name).drop(bind, checkfirst=True)
