from pathlib import Path
from unittest import TestCase, main


MIGRATION = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "0006_create_admin_audit_logs.py"
SOURCE = MIGRATION.read_text()


class AdminAuditMigrationSourceTests(TestCase):
    def test_revision_metadata_is_correct(self):
        self.assertIn('revision: str = "0006"', SOURCE)
        self.assertIn('down_revision: Union[str, None] = "0005"', SOURCE)

    def test_migration_creates_expected_table_columns_and_foreign_key(self):
        required_snippets = [
            'TABLE_NAME = "admin_audit_logs"',
            'sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True)',
            'sa.Column(\n                "admin_id",',
            'postgresql.UUID(as_uuid=True)',
            'sa.ForeignKey("users.id", ondelete="RESTRICT")',
            'sa.Column("action", sa.String(length=100), nullable=False)',
            'sa.Column("entity_type", sa.String(length=100), nullable=False)',
            'sa.Column("entity_id", sa.String(length=36), nullable=True)',
            'sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True)',
            'sa.DateTime(timezone=True)',
            'server_default=sa.func.now()',
        ]
        for snippet in required_snippets:
            self.assertIn(snippet, SOURCE)

    def test_migration_declares_all_required_indexes(self):
        for index_name in [
            "ix_audit_logs_admin_id",
            "ix_audit_logs_entity_type",
            "ix_audit_logs_entity_id",
            "ix_audit_logs_action",
            "ix_audit_logs_created_at",
        ]:
            self.assertIn(index_name, SOURCE)

    def test_migration_is_idempotent_and_uses_inspection(self):
        self.assertIn("sa.inspect(bind)", SOURCE)
        self.assertIn("inspector.get_table_names()", SOURCE)
        self.assertIn("inspector.get_indexes(TABLE_NAME)", SOURCE)
        self.assertIn("if not _table_exists():", SOURCE)
        self.assertIn("if index_name not in existing_indexes:", SOURCE)

    def test_migration_does_not_modify_users_or_roles_or_use_destructive_sql(self):
        forbidden = [
            "UPDATE users",
            "ALTER TABLE users",
            "DELETE FROM users",
            "TRUNCATE",
            "DROP TYPE",
            "create_all",
            "password_hash",
            "super_admin",
        ]
        for snippet in forbidden:
            self.assertNotIn(snippet, SOURCE)


if __name__ == "__main__":
    main()
