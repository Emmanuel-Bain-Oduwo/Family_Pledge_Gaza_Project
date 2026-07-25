from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest import TestCase, main
from uuid import uuid4
from unittest.mock import patch

try:
    from app.models.enums import AiContentStatus, AiFollowupStatus, ContributionStatus
    from app.services import ai_operations_service
except ModuleNotFoundError as exc:  # pragma: no cover - dependency-limited CI container
    import unittest
    raise unittest.SkipTest(f"backend dependencies unavailable: {exc}")


class ScalarResult:
    def __init__(self, items):
        self.items = items

    def all(self):
        return self.items


class FakeSession:
    def __init__(self, scalar_results=None, scalars_results=None, get_result=None):
        self.scalar_results = list(scalar_results or [])
        self.scalars_results = list(scalars_results or [])
        self.get_result = get_result
        self.added = []
        self.commits = 0
        self.refreshed = []
        self.flushes = 0

    def scalar(self, _statement):
        if self.scalar_results:
            return self.scalar_results.pop(0)
        return None

    def scalars(self, _statement):
        if self.scalars_results:
            return ScalarResult(self.scalars_results.pop(0))
        return ScalarResult([])

    def get(self, _model, _id):
        return self.get_result

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        self.refreshed.append(obj)

    def flush(self):
        self.flushes += 1


def admin():
    return SimpleNamespace(id=uuid4())


def donor(name="Amina Donor"):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=uuid4(),
        full_name=name,
        nickname=None,
        public_display_name=None,
        created_at=now - timedelta(days=45),
        updated_at=now - timedelta(days=45),
    )


class AiOperationsServiceTests(TestCase):
    def test_content_draft_uses_fallback_without_openai_key(self):
        db = FakeSession()
        with patch.object(ai_operations_service.settings, "OPENAI_API_KEY", None):
            content = ai_operations_service.generate_content_draft(
                db, admin(), "Create a Friday reminder", "friday_reminder", "push"
            )
        self.assertEqual(content.status, AiContentStatus.pending_approval)
        self.assertIn("AI suggestion", content.body)
        self.assertIn("Not sent yet", content.body)
        self.assertEqual(db.commits, 1)
        self.assertEqual(len(db.added), 2)  # content + audit log

    def test_followup_suggestions_are_read_first_and_do_not_persist_suggestions(self):
        d = donor()
        pledge = SimpleNamespace(id=uuid4(), user_id=d.id, user=d)
        contribution = SimpleNamespace(
            id=uuid4(),
            user_id=d.id,
            user=d,
            pledge_id=pledge.id,
            status=ContributionStatus.needs_follow_up,
        )
        campaign = SimpleNamespace(title="Water Relief", target_amount=100, raised_amount=50)
        db = FakeSession(
            scalar_results=[None, datetime.now(timezone.utc) - timedelta(days=40)],
            scalars_results=[[pledge], [contribution], [d], [campaign]],
        )

        suggestions = ai_operations_service.find_followup_suggestions(db)

        types = {item["type"] for item in suggestions}
        self.assertIn("monthly_pledge_missing_contribution", types)
        self.assertIn("contribution_needs_follow_up", types)
        self.assertIn("inactive_donor_30_days", types)
        self.assertIn("campaign_progress_summary", types)
        self.assertEqual(db.added, [])
        self.assertEqual(db.commits, 0)

    def test_view_followups_only_writes_audit_log(self):
        db = FakeSession(scalars_results=[[], [], [], []])
        suggestions = ai_operations_service.view_followup_suggestions(db, admin())
        self.assertEqual(suggestions, [])
        self.assertEqual(len(db.added), 1)
        self.assertEqual(db.added[0].action, "ai_followups.view")
        self.assertEqual(db.commits, 1)

    def test_approve_content_changes_status(self):
        content = SimpleNamespace(id=uuid4(), status=AiContentStatus.pending_approval, approved_by=None, approved_at=None)
        a = admin()
        db = FakeSession(get_result=content)
        updated = ai_operations_service.approve_generated_content(db, a, content.id)
        self.assertEqual(updated.status, AiContentStatus.approved)
        self.assertEqual(updated.approved_by, a.id)
        self.assertIsNotNone(updated.approved_at)
        self.assertEqual(db.commits, 1)

    def test_dismiss_followup_changes_status(self):
        suggestion = SimpleNamespace(id=uuid4(), status=AiFollowupStatus.new)
        db = FakeSession(get_result=suggestion)
        updated = ai_operations_service.dismiss_followup_suggestion(db, admin(), suggestion.id)
        self.assertEqual(updated.status, AiFollowupStatus.dismissed)
        self.assertEqual(db.commits, 1)


if __name__ == "__main__":
    main()
