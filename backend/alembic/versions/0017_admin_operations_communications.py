"""admin operations, donor communication consent and outbound queue

Revision ID: 0017
Revises: 0016
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("email_reminders_opt_in", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("whatsapp_reminders_opt_in", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_users_email_reminders_opt_in", "users", ["email_reminders_opt_in"])
    op.create_index("ix_users_whatsapp_reminders_opt_in", "users", ["whatsapp_reminders_opt_in"])

    op.create_table(
        "donor_admin_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_admin_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="normal"),
        sa.Column("followup_status", sa.String(length=30), nullable=False, server_default="none"),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("next_followup_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_contacted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_admin_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index("ix_donor_admin_profiles_assigned", "donor_admin_profiles", ["assigned_admin_id"])
    op.create_index("ix_donor_admin_profiles_followup", "donor_admin_profiles", ["followup_status", "next_followup_at"])
    op.create_index("ix_donor_admin_profiles_priority", "donor_admin_profiles", ["priority"])

    op.add_column("ai_followup_suggestions", sa.Column("assigned_admin_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("ai_followup_suggestions", sa.Column("snoozed_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("ai_followup_suggestions", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("ai_followup_suggestions", sa.Column("last_contacted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("ai_followup_suggestions", sa.Column("contact_channel", sa.String(length=20), nullable=True))
    op.create_foreign_key(
        "fk_ai_followup_assigned_admin",
        "ai_followup_suggestions",
        "users",
        ["assigned_admin_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_ai_followup_snoozed_until", "ai_followup_suggestions", ["snoozed_until"])
    op.create_index("ix_ai_followup_assigned_admin", "ai_followup_suggestions", ["assigned_admin_id"])

    op.create_table(
        "outbound_campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_admin_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("segment", sa.String(length=60), nullable=False),
        sa.Column("content_category", sa.String(length=40), nullable=True),
        sa.Column("channels", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="queued"),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("recipient_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["created_by_admin_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbound_campaigns_status_schedule", "outbound_campaigns", ["status", "scheduled_for"])
    op.create_index("ix_outbound_campaigns_created_by", "outbound_campaigns", ["created_by_admin_id"])

    op.create_table(
        "outbound_recipients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="queued"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["campaign_id"], ["outbound_campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("campaign_id", "user_id", "channel", name="uq_outbound_recipient_channel"),
    )
    op.create_index("ix_outbound_recipients_campaign_status", "outbound_recipients", ["campaign_id", "status"])
    op.create_index("ix_outbound_recipients_user", "outbound_recipients", ["user_id"])

    # Query paths used by the 2,000+ donor command center.
    op.create_index("ix_contributions_user_month_status", "contributions", ["user_id", "contribution_month", "status"])
    op.create_index("ix_pledges_user_status", "pledges", ["user_id", "status"])


def downgrade():
    op.drop_index("ix_pledges_user_status", table_name="pledges")
    op.drop_index("ix_contributions_user_month_status", table_name="contributions")
    op.drop_index("ix_outbound_recipients_user", table_name="outbound_recipients")
    op.drop_index("ix_outbound_recipients_campaign_status", table_name="outbound_recipients")
    op.drop_table("outbound_recipients")
    op.drop_index("ix_outbound_campaigns_created_by", table_name="outbound_campaigns")
    op.drop_index("ix_outbound_campaigns_status_schedule", table_name="outbound_campaigns")
    op.drop_table("outbound_campaigns")
    op.drop_index("ix_ai_followup_assigned_admin", table_name="ai_followup_suggestions")
    op.drop_index("ix_ai_followup_snoozed_until", table_name="ai_followup_suggestions")
    op.drop_constraint("fk_ai_followup_assigned_admin", "ai_followup_suggestions", type_="foreignkey")
    for name in ("contact_channel", "last_contacted_at", "resolved_at", "snoozed_until", "assigned_admin_id"):
        op.drop_column("ai_followup_suggestions", name)
    op.drop_index("ix_donor_admin_profiles_priority", table_name="donor_admin_profiles")
    op.drop_index("ix_donor_admin_profiles_followup", table_name="donor_admin_profiles")
    op.drop_index("ix_donor_admin_profiles_assigned", table_name="donor_admin_profiles")
    op.drop_table("donor_admin_profiles")
    op.drop_index("ix_users_whatsapp_reminders_opt_in", table_name="users")
    op.drop_index("ix_users_email_reminders_opt_in", table_name="users")
    op.drop_column("users", "whatsapp_reminders_opt_in")
    op.drop_column("users", "email_reminders_opt_in")
