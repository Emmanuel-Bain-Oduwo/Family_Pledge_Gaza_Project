"""guard monthly M-PESA attempts against duplicates

Revision ID: 0021_payment_attempt_guards
Revises: 0020_mpesa_payment_transactions
Create Date: 2026-08-23
"""

from alembic import op
import sqlalchemy as sa


revision = "0021_payment_attempt_guards"
down_revision = "0020_mpesa_payment_transactions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "uq_payment_active_monthly_pledge",
        "payment_transactions",
        ["user_id", "pledge_id", "contribution_month", "purpose"],
        unique=True,
        postgresql_where=sa.text(
            "purpose = 'monthly_pledge' AND status IN ('created','initiating','pending')"
        ),
    )
    op.create_index(
        "uq_payment_succeeded_monthly_pledge",
        "payment_transactions",
        ["user_id", "pledge_id", "contribution_month", "purpose"],
        unique=True,
        postgresql_where=sa.text(
            "purpose = 'monthly_pledge' AND status = 'succeeded'"
        ),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_payment_succeeded_monthly_pledge",
        table_name="payment_transactions",
    )
    op.drop_index(
        "uq_payment_active_monthly_pledge",
        table_name="payment_transactions",
    )
