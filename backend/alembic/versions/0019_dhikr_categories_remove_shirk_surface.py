"""add dhikr categories and retire shirk reminder surface

Revision ID: 0019
Revises: 0018
"""
from alembic import op
import sqlalchemy as sa

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("daily_reminders", sa.Column("dhikr_category", sa.String(length=40), nullable=True))
    op.create_index(
        "ix_reminders_type_dhikr_category_status",
        "daily_reminders",
        ["reminder_type", "dhikr_category", "status"],
    )

    # PostgreSQL enum values are deliberately not removed in-place. Retire any
    # legacy Shirk rows safely so they disappear from user/admin publication flows.
    op.execute(
        """
        UPDATE daily_reminders
        SET status = 'archived'
        WHERE reminder_type = 'shirk'
          AND status <> 'archived'
        """
    )


def downgrade():
    op.drop_index("ix_reminders_type_dhikr_category_status", table_name="daily_reminders")
    op.drop_column("daily_reminders", "dhikr_category")
    # Archived legacy content is intentionally not republished automatically.
