"""add notification delivery counts

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "notifications",
        sa.Column("failure_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("notifications", "failure_count")
    op.drop_column("notifications", "sent_count")
