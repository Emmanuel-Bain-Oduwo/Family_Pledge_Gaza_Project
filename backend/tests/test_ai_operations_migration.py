from pathlib import Path
from unittest import TestCase, main

MIGRATION = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "0008_ai_operations_assistant.py"
SOURCE = MIGRATION.read_text()


class AiOperationsMigrationSourceTests(TestCase):
    def test_revision_chain_is_correct(self):
        self.assertIn('revision: str = "0008"', SOURCE)
        self.assertIn('down_revision: Union[str, None] = "0007"', SOURCE)

    def test_migration_creates_phase_one_tables(self):
        for table in ["ai_tasks", "ai_task_runs", "ai_generated_content", "ai_followup_suggestions"]:
            self.assertIn(f'op.create_table("{table}"', SOURCE)

    def test_migration_has_safe_status_values(self):
        for value in ["waiting_approval", "pending_approval", "dismissed", "urgent", "custom_admin_task"]:
            self.assertIn(value, SOURCE)

    def test_migration_does_not_touch_core_records_destructively(self):
        for forbidden in ["DELETE FROM", "TRUNCATE", "DROP TABLE users", "DROP TABLE contributions", "DROP TABLE campaigns"]:
            self.assertNotIn(forbidden, SOURCE)


if __name__ == "__main__":
    main()
