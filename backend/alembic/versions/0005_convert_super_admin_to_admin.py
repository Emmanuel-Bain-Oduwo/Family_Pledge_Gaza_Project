"""convert super_admin users to admin

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-12
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'super_admin'")


def downgrade() -> None:
    # Intentionally do not recreate legacy super_admin assignments.
    pass
