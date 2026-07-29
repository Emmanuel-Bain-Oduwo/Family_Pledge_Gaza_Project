"""add tracked contacts

Revision ID: 0011
Revises: 0010
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("tracked_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False), sa.Column("phone", sa.String(30)),
        sa.Column("email", sa.String(255)), sa.Column("country", sa.String(100)),
        sa.Column("status", sa.String(30), nullable=False, server_default="following_up"),
        sa.Column("notes", sa.Text()), sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"))
    op.create_index("ix_tracked_contacts_status_created", "tracked_contacts", ["status", "created_at"])

def downgrade():
    op.drop_index("ix_tracked_contacts_status_created", table_name="tracked_contacts")
    op.drop_table("tracked_contacts")
