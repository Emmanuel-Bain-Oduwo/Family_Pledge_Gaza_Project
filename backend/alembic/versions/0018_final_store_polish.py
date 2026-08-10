"""final store polish: pledge agreement, support inbox and reminder preferences

Revision ID: 0018
Revises: 0017
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade():
    # Existing PostgreSQL enum values are extended in-place so current reminders remain valid.
    op.execute("ALTER TYPE reminder_type ADD VALUE IF NOT EXISTS 'dhikr'")
    op.execute("ALTER TYPE reminder_type ADD VALUE IF NOT EXISTS 'shirk'")

    op.add_column("pledges", sa.Column("agreement_accepted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("pledges", sa.Column("agreement_version", sa.String(length=32), nullable=True))

    op.add_column("users", sa.Column("notification_dhikr", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("notification_shirk", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("notification_sadaqah", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.create_table(
        "support_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False, server_default="general"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("admin_response", sa.Text(), nullable=True),
        sa.Column("responded_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["responded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_support_messages_user", "support_messages", ["user_id"])
    op.create_index("ix_support_messages_status_created", "support_messages", ["status", "created_at"])


def downgrade():
    op.drop_index("ix_support_messages_status_created", table_name="support_messages")
    op.drop_index("ix_support_messages_user", table_name="support_messages")
    op.drop_table("support_messages")
    op.drop_column("users", "notification_sadaqah")
    op.drop_column("users", "notification_shirk")
    op.drop_column("users", "notification_dhikr")
    op.drop_column("pledges", "agreement_version")
    op.drop_column("pledges", "agreement_accepted_at")
    # PostgreSQL enum values are intentionally left in place on downgrade.
