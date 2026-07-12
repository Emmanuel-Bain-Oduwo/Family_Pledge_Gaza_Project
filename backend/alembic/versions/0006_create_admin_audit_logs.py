"""create admin audit logs

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE_NAME = "admin_audit_logs"
INDEXES = {
    "ix_audit_logs_admin_id": ["admin_id"],
    "ix_audit_logs_entity_type": ["entity_type"],
    "ix_audit_logs_entity_id": ["entity_id"],
    "ix_audit_logs_action": ["action"],
    "ix_audit_logs_created_at": ["created_at"],
}


def _table_exists() -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return TABLE_NAME in inspector.get_table_names()


def _existing_index_names() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not _table_exists():
        return set()
    return {index["name"] for index in inspector.get_indexes(TABLE_NAME)}


def _create_missing_indexes() -> None:
    existing_indexes = _existing_index_names()
    for index_name, columns in INDEXES.items():
        if index_name not in existing_indexes:
            op.create_index(index_name, TABLE_NAME, columns)


def upgrade() -> None:
    if not _table_exists():
        op.create_table(
            TABLE_NAME,
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "admin_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="RESTRICT"),
                nullable=False,
            ),
            sa.Column("action", sa.String(length=100), nullable=False),
            sa.Column("entity_type", sa.String(length=100), nullable=False),
            sa.Column("entity_id", sa.String(length=36), nullable=True),
            sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
        )
    _create_missing_indexes()


def downgrade() -> None:
    if not _table_exists():
        return

    existing_indexes = _existing_index_names()
    for index_name in INDEXES:
        if index_name in existing_indexes:
            op.drop_index(index_name, table_name=TABLE_NAME)
    op.drop_table(TABLE_NAME)
