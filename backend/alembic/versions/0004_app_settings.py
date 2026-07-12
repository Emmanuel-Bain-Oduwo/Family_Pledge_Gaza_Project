"""add app settings

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payment_link", sa.String(length=1024), nullable=False, server_default="https://familypledge.org/contribute"),
        sa.Column("payment_instructions", sa.Text(), nullable=False, server_default="Use the official Family Pledge payment link or DIB Bank/M-PESA details, then submit your transaction reference in the app."),
        sa.Column("org_contact_email", sa.String(length=255), nullable=False, server_default="support@familypledge.org"),
        sa.Column("org_contact_phone", sa.String(length=50), nullable=False, server_default="+254700000000"),
        sa.Column("app_notice", sa.Text(), nullable=False, server_default=""),
        sa.Column("privacy_policy_url", sa.String(length=1024), nullable=False, server_default="https://familypledge.org/privacy"),
        sa.Column("terms_url", sa.String(length=1024), nullable=False, server_default="https://familypledge.org/terms"),
        sa.Column("payment_account_name", sa.String(length=255), nullable=False, server_default="NAMLEF GAZA FAMILY SUPPORT"),
        sa.Column("payment_account_number", sa.String(length=50), nullable=False, server_default="001505100664103"),
        sa.Column("payment_currency", sa.String(length=10), nullable=False, server_default="KES"),
        sa.Column("payment_bank_name", sa.String(length=255), nullable=False, server_default="DIB Bank Kenya Limited"),
        sa.Column("payment_branch_name", sa.String(length=255), nullable=False, server_default="Upper Hill Branch"),
        sa.Column("payment_swift_code", sa.String(length=50), nullable=False, server_default="DUIBKENA"),
        sa.Column("payment_intermediary_bank", sa.String(length=255), nullable=False, server_default="J.P. Morgan Chase Bank, NY"),
        sa.Column("payment_intermediary_swift_code", sa.String(length=50), nullable=False, server_default="CHASUS33"),
        sa.Column("payment_mpesa_paybill", sa.String(length=50), nullable=False, server_default="342342"),
        sa.Column("payment_bank_code", sa.String(length=20), nullable=False, server_default="75"),
        sa.Column("payment_branch_code", sa.String(length=20), nullable=False, server_default="001"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
