"""private contribution proof references and retention

Revision ID: 0013
Revises: 0012
"""
from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "contributions",
        sa.Column("proof_object_key", sa.String(length=1024), nullable=True),
    )
    op.add_column(
        "contributions",
        sa.Column("proof_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_contributions_proof_expires_at",
        "contributions",
        ["proof_expires_at"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_contributions_proof_expires_at", table_name="contributions")
    op.drop_column("contributions", "proof_expires_at")
    op.drop_column("contributions", "proof_object_key")
