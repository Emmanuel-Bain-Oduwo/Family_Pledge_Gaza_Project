"""notification endpoints for native and web push

Revision ID: 0015
Revises: 0014
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notification_endpoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("platform", sa.String(length=20), nullable=False),
        sa.Column("token", sa.String(length=2048), nullable=False),
        sa.Column("device_id", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "token", name="uq_notification_endpoint_provider_token"),
    )
    op.create_index(
        "ix_notification_endpoints_user_active",
        "notification_endpoints",
        ["user_id", "is_active"],
        unique=False,
    )
    op.create_index(
        "ix_notification_endpoints_provider_platform",
        "notification_endpoints",
        ["provider", "platform"],
        unique=False,
    )

    # Existing users.push_token values remain supported by the notification
    # service for backward compatibility. New app builds populate this table,
    # avoiding any migration dependency on PostgreSQL UUID extensions.


def downgrade():
    op.drop_index("ix_notification_endpoints_provider_platform", table_name="notification_endpoints")
    op.drop_index("ix_notification_endpoints_user_active", table_name="notification_endpoints")
    op.drop_table("notification_endpoints")
