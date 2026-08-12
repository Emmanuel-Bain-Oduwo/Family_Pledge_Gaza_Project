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

    # reminder_type gained these enum values in 0018. PostgreSQL does not allow a
    # newly-added enum value to be used as an enum literal until the transaction is
    # committed. Cast the stored enum to text here so a fresh `alembic upgrade head`
    # remains valid while still supporting databases where the values already exist.
    op.execute(
        """
        UPDATE daily_reminders
        SET dhikr_category = 'anytime'
        WHERE reminder_type::text = 'dhikr'
          AND dhikr_category IS NULL
        """
    )

    # PostgreSQL enum values are deliberately not removed in-place. Retire any
    # legacy Shirk rows safely so they disappear from user/admin publication flows.
    op.execute(
        """
        UPDATE daily_reminders
        SET status = 'archived'
        WHERE reminder_type::text = 'shirk'
          AND status <> 'archived'
        """
    )


def downgrade():
    op.drop_index("ix_reminders_type_dhikr_category_status", table_name="daily_reminders")
    op.drop_column("daily_reminders", "dhikr_category")
    # Archived legacy content is intentionally not republished automatically.
