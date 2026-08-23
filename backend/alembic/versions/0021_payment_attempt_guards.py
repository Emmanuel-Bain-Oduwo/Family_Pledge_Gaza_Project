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
    # Prevent two app-initiated monthly STK requests from being active at once.
    # We intentionally do not forbid multiple historical succeeded payments: if
    # an external provider ever settles an accidental duplicate, the ledger must
    # be able to record the real-world event for reconciliation rather than hide it.
    op.create_index(
        "uq_payment_active_monthly_pledge",
        "payment_transactions",
        ["user_id", "pledge_id", "contribution_month", "purpose"],
        unique=True,
        postgresql_where=sa.text(
            "purpose = 'monthly_pledge' AND status IN ('created','initiating','pending')"
        ),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_payment_active_monthly_pledge",
        table_name="payment_transactions",
    )
