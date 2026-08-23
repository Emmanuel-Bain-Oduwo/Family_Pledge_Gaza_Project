"""add M-PESA payment transaction ledger

Revision ID: 0020_mpesa_payment_transactions
Revises: 0019_dhikr_categories_remove_shirk_surface
Create Date: 2026-08-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0020_mpesa_payment_transactions"
down_revision = "0019_dhikr_categories_remove_shirk_surface"
branch_labels = None
depends_on = None


PAYMENT_STATUS_VALUES = (
    "created",
    "initiating",
    "pending",
    "succeeded",
    "failed",
    "cancelled",
    "expired",
)


def upgrade() -> None:
    payment_status = postgresql.ENUM(*PAYMENT_STATUS_VALUES, name="payment_status")
    payment_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "payment_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pledge_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=False, server_default="mpesa"),
        sa.Column("payment_method", sa.String(length=32), nullable=False, server_default="stk_push"),
        sa.Column("purpose", sa.String(length=64), nullable=False, server_default="monthly_pledge"),
        sa.Column("contribution_month", sa.String(length=7), nullable=False),
        sa.Column("status", payment_status, nullable=False, server_default="created"),
        sa.Column("requested_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("requested_currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("settlement_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("settlement_currency", sa.String(length=3), nullable=False, server_default="KES"),
        sa.Column("fx_rate", sa.Numeric(16, 6), nullable=True),
        sa.Column("payer_phone", sa.String(length=32), nullable=False),
        sa.Column("internal_reference", sa.String(length=64), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("merchant_request_id", sa.String(length=128), nullable=True),
        sa.Column("checkout_request_id", sa.String(length=128), nullable=True),
        sa.Column("provider_transaction_id", sa.String(length=128), nullable=True),
        sa.Column("mpesa_receipt_number", sa.String(length=64), nullable=True),
        sa.Column("provider_result_code", sa.String(length=64), nullable=True),
        sa.Column("provider_result_description", sa.Text(), nullable=True),
        sa.Column("initiated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pledge_id"], ["pledges.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key", name="uq_payment_transactions_idempotency_key"),
        sa.UniqueConstraint("checkout_request_id", name="uq_payment_transactions_checkout_request_id"),
        sa.UniqueConstraint("mpesa_receipt_number", name="uq_payment_transactions_mpesa_receipt"),
    )
    op.create_index("ix_payment_transactions_user_id", "payment_transactions", ["user_id"])
    op.create_index("ix_payment_transactions_pledge_id", "payment_transactions", ["pledge_id"])
    op.create_index("ix_payment_transactions_campaign_id", "payment_transactions", ["campaign_id"])
    op.create_index("ix_payment_transactions_month", "payment_transactions", ["contribution_month"])
    op.create_index("ix_payment_transactions_status", "payment_transactions", ["status"])
    op.create_index("ix_payment_transactions_internal_reference", "payment_transactions", ["internal_reference"])

    op.add_column(
        "contributions",
        sa.Column("payment_transaction_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_contributions_payment_transaction_id",
        "contributions",
        "payment_transactions",
        ["payment_transaction_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_unique_constraint(
        "uq_contributions_payment_transaction_id",
        "contributions",
        ["payment_transaction_id"],
    )
    op.create_index(
        "ix_contributions_payment_transaction_id",
        "contributions",
        ["payment_transaction_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_contributions_payment_transaction_id", table_name="contributions")
    op.drop_constraint("uq_contributions_payment_transaction_id", "contributions", type_="unique")
    op.drop_constraint("fk_contributions_payment_transaction_id", "contributions", type_="foreignkey")
    op.drop_column("contributions", "payment_transaction_id")

    op.drop_index("ix_payment_transactions_internal_reference", table_name="payment_transactions")
    op.drop_index("ix_payment_transactions_status", table_name="payment_transactions")
    op.drop_index("ix_payment_transactions_month", table_name="payment_transactions")
    op.drop_index("ix_payment_transactions_campaign_id", table_name="payment_transactions")
    op.drop_index("ix_payment_transactions_pledge_id", table_name="payment_transactions")
    op.drop_index("ix_payment_transactions_user_id", table_name="payment_transactions")
    op.drop_table("payment_transactions")

    payment_status = postgresql.ENUM(*PAYMENT_STATUS_VALUES, name="payment_status")
    payment_status.drop(op.get_bind(), checkfirst=True)
