"""engagement goals circles events and richer reminder preferences

Revision ID: 0016
Revises: 0015
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade():
    for name in (
        "notification_quran",
        "notification_hadith",
        "notification_dua",
        "notification_motivation",
        "notification_impact",
        "notification_humanitarian",
    ):
        op.add_column("users", sa.Column(name, sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("notifications", sa.Column("content_category", sa.String(length=40), nullable=True))
    op.create_index("ix_notifications_content_category", "notifications", ["content_category"])

    op.create_table(
        "engagement_goals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("goal_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("target_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("current_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cadence", sa.String(length=30), nullable=False, server_default="once"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("starts_on", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("ends_on", sa.Date(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_engagement_goals_user_status", "engagement_goals", ["user_id", "status"])
    op.create_index("ix_engagement_goals_type", "engagement_goals", ["goal_type"])

    op.create_table(
        "engagement_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_engagement_events_user_type", "engagement_events", ["user_id", "event_type"])
    op.create_index("ix_engagement_events_created", "engagement_events", ["created_at"])

    op.create_table(
        "pledge_circles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("invite_code", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invite_code"),
    )
    op.create_index("ix_pledge_circles_owner", "pledge_circles", ["owner_user_id"])
    op.create_index("ix_pledge_circles_invite_code", "pledge_circles", ["invite_code"])

    op.create_table(
        "pledge_circle_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("circle_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["circle_id"], ["pledge_circles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("circle_id", "user_id", name="uq_pledge_circle_member"),
    )
    op.create_index("ix_pledge_circle_members_user", "pledge_circle_members", ["user_id"])
    op.create_index("ix_pledge_circle_members_circle", "pledge_circle_members", ["circle_id"])

    op.create_table(
        "feature_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_feature_requests_status", "feature_requests", ["status"])


def downgrade():
    op.drop_index("ix_feature_requests_status", table_name="feature_requests")
    op.drop_table("feature_requests")
    op.drop_index("ix_pledge_circle_members_circle", table_name="pledge_circle_members")
    op.drop_index("ix_pledge_circle_members_user", table_name="pledge_circle_members")
    op.drop_table("pledge_circle_members")
    op.drop_index("ix_pledge_circles_invite_code", table_name="pledge_circles")
    op.drop_index("ix_pledge_circles_owner", table_name="pledge_circles")
    op.drop_table("pledge_circles")
    op.drop_index("ix_engagement_events_created", table_name="engagement_events")
    op.drop_index("ix_engagement_events_user_type", table_name="engagement_events")
    op.drop_table("engagement_events")
    op.drop_index("ix_engagement_goals_type", table_name="engagement_goals")
    op.drop_index("ix_engagement_goals_user_status", table_name="engagement_goals")
    op.drop_table("engagement_goals")
    op.drop_index("ix_notifications_content_category", table_name="notifications")
    op.drop_column("notifications", "content_category")
    for name in (
        "notification_humanitarian",
        "notification_impact",
        "notification_motivation",
        "notification_dua",
        "notification_hadith",
        "notification_quran",
    ):
        op.drop_column("users", name)
