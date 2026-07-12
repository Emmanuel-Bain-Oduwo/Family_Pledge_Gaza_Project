"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-06-30

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



USER_ROLE = postgresql.ENUM("donor", "admin", "collector", "super_admin", name="user_role", create_type=False)
PLEDGE_TYPE = postgresql.ENUM("monthly", "free_participant", name="pledge_type", create_type=False)
PLEDGE_STATUS = postgresql.ENUM("active", "paused", "cancelled", name="pledge_status", create_type=False)
CONTRIBUTION_STATUS = postgresql.ENUM("submitted", "confirmed", "rejected", "needs_follow_up", name="contribution_status", create_type=False)
CAMPAIGN_TYPE = postgresql.ENUM("monthly", "friday", "emergency", "sponsorship", "food", "water", "clothing", "general", name="campaign_type", create_type=False)
CAMPAIGN_STATUS = postgresql.ENUM("draft", "active", "completed", "archived", name="campaign_status", create_type=False)
PROJECT_CATEGORY = postgresql.ENUM("food", "water", "clothing", "emergency_cash", "orphans", "widows", "children", "general", name="project_category", create_type=False)
PROJECT_STATUS = postgresql.ENUM("upcoming", "active", "completed", "archived", name="project_status", create_type=False)
REMINDER_TYPE = postgresql.ENUM("quran", "hadith", "dua", "motivation", "friday", "sadaqah", name="reminder_type", create_type=False)
REMINDER_STATUS = postgresql.ENUM("draft", "approved", "published", "archived", name="reminder_status", create_type=False)
NOTIFICATION_TYPE = postgresql.ENUM("pledge", "campaign", "emergency", "reminder", "impact", "system", name="notification_type", create_type=False)
NOTIFICATION_AUDIENCE = postgresql.ENUM("all_users", "pending_donors", "confirmed_donors", "collectors", "admins", name="notification_audience", create_type=False)
NAMLEF_CONTENT_TYPE = postgresql.ENUM("video", "audio", "text", "link", name="namlef_content_type", create_type=False)
NAMLEF_CONTENT_STATUS = postgresql.ENUM("draft", "published", "archived", name="namlef_content_status", create_type=False)
AI_DRAFT_TYPE = postgresql.ENUM("reminder", "impact_update", "friday_challenge", "emergency_appeal", "weekly_summary", "collector_message", "social_caption", name="ai_draft_type", create_type=False)
AI_DRAFT_STATUS = postgresql.ENUM("draft", "approved", "rejected", "published", name="ai_draft_status", create_type=False)

ALL_ENUMS = (
    USER_ROLE,
    PLEDGE_TYPE,
    PLEDGE_STATUS,
    CONTRIBUTION_STATUS,
    CAMPAIGN_TYPE,
    CAMPAIGN_STATUS,
    PROJECT_CATEGORY,
    PROJECT_STATUS,
    REMINDER_TYPE,
    REMINDER_STATUS,
    NOTIFICATION_TYPE,
    NOTIFICATION_AUDIENCE,
    NAMLEF_CONTENT_TYPE,
    NAMLEF_CONTENT_STATUS,
    AI_DRAFT_TYPE,
    AI_DRAFT_STATUS,
)

def upgrade() -> None:
    # ── Enums ──────────────────────────────────────────────────────────────────
    bind = op.get_bind()
    for enum in ALL_ENUMS:
        enum.create(bind, checkfirst=True)

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("nickname", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(30), nullable=True, unique=True),
        sa.Column("email", sa.String(255), nullable=True, unique=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", USER_ROLE, nullable=False, server_default="donor"),
        sa.Column("anonymous_publicly", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("public_display_name", sa.String(100), nullable=True),
        sa.Column("collector_code", sa.String(50), nullable=True, unique=True),
        sa.Column("push_token", sa.String(512), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_country", "users", ["country"])
    op.create_index("ix_users_is_active", "users", ["is_active"])
    op.create_index("ix_users_deleted_at", "users", ["deleted_at"])

    # ── campaigns ─────────────────────────────────────────────────────────────
    op.create_table(
        "campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("campaign_type", CAMPAIGN_TYPE, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("target_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("raised_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("donor_target", sa.Integer, nullable=True),
        sa.Column("donor_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", CAMPAIGN_STATUS, nullable=False, server_default="draft"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cover_image_url", sa.String(1024), nullable=True),
        sa.Column("video_url", sa.String(1024), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_campaigns_status", "campaigns", ["status"])
    op.create_index("ix_campaigns_type", "campaigns", ["campaign_type"])
    op.create_index("ix_campaigns_created_by", "campaigns", ["created_by"])
    op.create_index("ix_campaigns_starts_at", "campaigns", ["starts_at"])
    op.create_index("ix_campaigns_deleted_at", "campaigns", ["deleted_at"])

    # ── projects ──────────────────────────────────────────────────────────────
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", PROJECT_CATEGORY, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("target_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("raised_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("beneficiaries_count", sa.Integer, nullable=True),
        sa.Column("status", PROJECT_STATUS, nullable=False, server_default="upcoming"),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("cover_image_url", sa.String(1024), nullable=True),
        sa.Column("video_url", sa.String(1024), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_projects_status", "projects", ["status"])
    op.create_index("ix_projects_category", "projects", ["category"])
    op.create_index("ix_projects_created_by", "projects", ["created_by"])
    op.create_index("ix_projects_deleted_at", "projects", ["deleted_at"])

    # ── pledges ───────────────────────────────────────────────────────────────
    op.create_table(
        "pledges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False, server_default="10.00"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("pledge_type", PLEDGE_TYPE, nullable=False, server_default="monthly"),
        sa.Column("status", PLEDGE_STATUS, nullable=False, server_default="active"),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_pledges_user_id", "pledges", ["user_id"])
    op.create_index("ix_pledges_status", "pledges", ["status"])
    op.create_index("ix_pledges_type", "pledges", ["pledge_type"])

    # ── contributions ─────────────────────────────────────────────────────────
    op.create_table(
        "contributions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pledge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pledges.id", ondelete="SET NULL"), nullable=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("contribution_channel", sa.String(100), nullable=True),
        sa.Column("payment_link_used", sa.String(1024), nullable=True),
        sa.Column("transaction_reference", sa.String(255), nullable=True),
        sa.Column("proof_image_url", sa.String(1024), nullable=True),
        sa.Column("status", CONTRIBUTION_STATUS, nullable=False, server_default="submitted"),
        sa.Column("contribution_month", sa.String(7), nullable=False),
        sa.Column("admin_note", sa.Text, nullable=True),
        sa.Column("confirmed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_contributions_user_id", "contributions", ["user_id"])
    op.create_index("ix_contributions_pledge_id", "contributions", ["pledge_id"])
    op.create_index("ix_contributions_campaign_id", "contributions", ["campaign_id"])
    op.create_index("ix_contributions_status", "contributions", ["status"])
    op.create_index("ix_contributions_month", "contributions", ["contribution_month"])
    op.create_index("ix_contributions_confirmed_by", "contributions", ["confirmed_by"])
    op.create_index("ix_contributions_reference", "contributions", ["transaction_reference"])

    # ── impact_cards ──────────────────────────────────────────────────────────
    op.create_table(
        "impact_cards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("story", sa.Text, nullable=False),
        sa.Column("beneficiaries_count", sa.Integer, nullable=True),
        sa.Column("image_url", sa.String(1024), nullable=True),
        sa.Column("video_url", sa.String(1024), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_impact_cards_project_id", "impact_cards", ["project_id"])
    op.create_index("ix_impact_cards_created_by", "impact_cards", ["created_by"])
    op.create_index("ix_impact_cards_completed_at", "impact_cards", ["completed_at"])

    # ── daily_reminders ───────────────────────────────────────────────────────
    op.create_table(
        "daily_reminders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("reminder_type", REMINDER_TYPE, nullable=False),
        sa.Column("arabic_text", sa.Text, nullable=True),
        sa.Column("translation", sa.Text, nullable=True),
        sa.Column("explanation", sa.Text, nullable=True),
        sa.Column("source_reference", sa.String(255), nullable=True),
        sa.Column("image_url", sa.String(1024), nullable=True),
        sa.Column("status", REMINDER_STATUS, nullable=False, server_default="draft"),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reminders_status", "daily_reminders", ["status"])
    op.create_index("ix_reminders_type", "daily_reminders", ["reminder_type"])
    op.create_index("ix_reminders_created_by", "daily_reminders", ["created_by"])
    op.create_index("ix_reminders_scheduled_for", "daily_reminders", ["scheduled_for"])

    # ── notifications ─────────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("notification_type", NOTIFICATION_TYPE, nullable=False),
        sa.Column("audience", NOTIFICATION_AUDIENCE, nullable=False),
        sa.Column("sent_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notifications_sent_by", "notifications", ["sent_by"])
    op.create_index("ix_notifications_audience", "notifications", ["audience"])
    op.create_index("ix_notifications_type", "notifications", ["notification_type"])
    op.create_index("ix_notifications_sent_at", "notifications", ["sent_at"])

    # ── collectors ────────────────────────────────────────────────────────────
    op.create_table(
        "collectors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("collector_code", sa.String(50), nullable=False, unique=True),
        sa.Column("group_name", sa.String(255), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_collectors_user_id", "collectors", ["user_id"])
    op.create_index("ix_collectors_country", "collectors", ["country"])

    # ── collector_members ─────────────────────────────────────────────────────
    op.create_table(
        "collector_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("collector_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("collectors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("donor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("collector_id", "donor_user_id", name="uq_collector_member"),
    )
    op.create_index("ix_collector_members_collector_id", "collector_members", ["collector_id"])
    op.create_index("ix_collector_members_donor_user_id", "collector_members", ["donor_user_id"])

    # ── namlef_content ────────────────────────────────────────────────────────
    op.create_table(
        "namlef_content",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("speaker_name", sa.String(255), nullable=True),
        sa.Column("speaker_role", sa.String(255), nullable=True),
        sa.Column("content_type", NAMLEF_CONTENT_TYPE, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("url", sa.String(1024), nullable=True),
        sa.Column("thumbnail_url", sa.String(1024), nullable=True),
        sa.Column("is_featured", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("status", NAMLEF_CONTENT_STATUS, nullable=False, server_default="draft"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_namlef_content_status", "namlef_content", ["status"])
    op.create_index("ix_namlef_content_type", "namlef_content", ["content_type"])
    op.create_index("ix_namlef_content_is_featured", "namlef_content", ["is_featured"])
    op.create_index("ix_namlef_content_created_by", "namlef_content", ["created_by"])

    # ── badges ────────────────────────────────────────────────────────────────
    op.create_table(
        "badges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("icon_url", sa.String(1024), nullable=True),
        sa.Column("rule_type", sa.String(100), nullable=True),
        sa.Column("rule_value", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── user_badges ───────────────────────────────────────────────────────────
    op.create_table(
        "user_badges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("badge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("badges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("awarded_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )
    op.create_index("ix_user_badges_user_id", "user_badges", ["user_id"])
    op.create_index("ix_user_badges_badge_id", "user_badges", ["badge_id"])

    # ── ai_drafts ─────────────────────────────────────────────────────────────
    op.create_table(
        "ai_drafts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("draft_type", AI_DRAFT_TYPE, nullable=False),
        sa.Column("input_context", postgresql.JSONB, nullable=True),
        sa.Column("generated_text", sa.Text, nullable=False),
        sa.Column("status", AI_DRAFT_STATUS, nullable=False, server_default="draft"),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_drafts_admin_id", "ai_drafts", ["admin_id"])
    op.create_index("ix_ai_drafts_status", "ai_drafts", ["status"])
    op.create_index("ix_ai_drafts_type", "ai_drafts", ["draft_type"])
    op.create_index("ix_ai_drafts_approved_by", "ai_drafts", ["approved_by"])

    # ── admin_audit_logs ──────────────────────────────────────────────────────
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_admin_id", "admin_audit_logs", ["admin_id"])
    op.create_index("ix_audit_logs_entity_type", "admin_audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_entity_id", "admin_audit_logs", ["entity_id"])
    op.create_index("ix_audit_logs_action", "admin_audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "admin_audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("admin_audit_logs")
    op.drop_table("ai_drafts")
    op.drop_table("user_badges")
    op.drop_table("badges")
    op.drop_table("namlef_content")
    op.drop_table("collector_members")
    op.drop_table("collectors")
    op.drop_table("notifications")
    op.drop_table("daily_reminders")
    op.drop_table("impact_cards")
    op.drop_table("contributions")
    op.drop_table("pledges")
    op.drop_table("projects")
    op.drop_table("campaigns")
    op.drop_table("users")

    bind = op.get_bind()
    for enum in reversed(ALL_ENUMS):
        enum.drop(bind, checkfirst=True)
