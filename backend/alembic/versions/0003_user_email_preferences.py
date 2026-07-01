"""add weekly email preferences

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-01

"""

from typing import Sequence, Union

import secrets
import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("weekly_email_opt_in", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column("users", sa.Column("email_unsubscribe_token", sa.String(length=64), nullable=True))

    bind = op.get_bind()
    for row in bind.execute(sa.text("SELECT id FROM users WHERE email_unsubscribe_token IS NULL")):
        bind.execute(
            sa.text("UPDATE users SET email_unsubscribe_token = :token WHERE id = :id"),
            {"token": secrets.token_urlsafe(32), "id": row.id},
        )

    op.alter_column("users", "email_unsubscribe_token", nullable=False)
    op.create_unique_constraint("uq_users_email_unsubscribe_token", "users", ["email_unsubscribe_token"])
    op.create_index("ix_users_weekly_email_opt_in", "users", ["weekly_email_opt_in"])


def downgrade() -> None:
    op.drop_index("ix_users_weekly_email_opt_in", table_name="users")
    op.drop_constraint("uq_users_email_unsubscribe_token", "users", type_="unique")
    op.drop_column("users", "email_unsubscribe_token")
    op.drop_column("users", "weekly_email_opt_in")
