"""opt-in notification preferences

Revision ID: 0014
Revises: 0013
"""
from alembic import op
import sqlalchemy as sa

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade():
    for name in (
        "notification_daily",
        "notification_friday",
        "notification_campaigns",
        "notification_emergency",
        "notification_onboarding_seen",
    ):
        op.add_column(
            "users",
            sa.Column(name, sa.Boolean(), nullable=False, server_default=sa.false()),
        )


def downgrade():
    for name in reversed(
        (
            "notification_daily",
            "notification_friday",
            "notification_campaigns",
            "notification_emergency",
            "notification_onboarding_seen",
        )
    ):
        op.drop_column("users", name)
