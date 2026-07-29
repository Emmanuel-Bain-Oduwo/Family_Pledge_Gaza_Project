"""link tracked contacts with referral codes

Revision ID: 0012
Revises: 0011
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("tracked_contacts", sa.Column("referral_code", sa.String(50)))
    op.add_column("tracked_contacts", sa.Column("linked_user_id", postgresql.UUID(as_uuid=True)))
    op.create_unique_constraint("uq_tracked_contacts_referral_code", "tracked_contacts", ["referral_code"])
    op.create_unique_constraint("uq_tracked_contacts_linked_user_id", "tracked_contacts", ["linked_user_id"])
    op.create_foreign_key("fk_tracked_contacts_linked_user", "tracked_contacts", "users", ["linked_user_id"], ["id"], ondelete="SET NULL")


def downgrade():
    op.drop_constraint("fk_tracked_contacts_linked_user", "tracked_contacts", type_="foreignkey")
    op.drop_constraint("uq_tracked_contacts_linked_user_id", "tracked_contacts", type_="unique")
    op.drop_constraint("uq_tracked_contacts_referral_code", "tracked_contacts", type_="unique")
    op.drop_column("tracked_contacts", "linked_user_id")
    op.drop_column("tracked_contacts", "referral_code")
