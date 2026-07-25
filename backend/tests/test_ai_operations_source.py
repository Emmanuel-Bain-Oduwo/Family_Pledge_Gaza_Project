from pathlib import Path
from unittest import TestCase, main

SERVICE = Path(__file__).resolve().parents[1] / "app" / "services" / "ai_operations_service.py"
ROUTES = Path(__file__).resolve().parents[1] / "app" / "api" / "routes" / "ai_operations.py"
SERVICE_SOURCE = SERVICE.read_text()
ROUTE_SOURCE = ROUTES.read_text()


class AiOperationsSourceTests(TestCase):
    def test_followup_detection_is_read_only_until_view_audit(self):
        start = SERVICE_SOURCE.index("def find_followup_suggestions")
        end = SERVICE_SOURCE.index("def view_followup_suggestions")
        body = SERVICE_SOURCE[start:end]
        self.assertNotIn("db.add(", body)
        self.assertNotIn("db.commit(", body)
        self.assertIn("ContributionStatus.rejected", body)
        self.assertIn("inactive_donor_30_days", body)

    def test_view_followups_only_audits_viewing_suggestions(self):
        start = SERVICE_SOURCE.index("def view_followup_suggestions")
        end = SERVICE_SOURCE.index("def create_ai_task")
        body = SERVICE_SOURCE[start:end]
        self.assertIn('"ai_followups.view"', body)
        self.assertIn("db.commit()", body)
        self.assertNotIn("AiFollowupSuggestion(", body)

    def test_content_generation_falls_back_without_openai_key(self):
        self.assertIn("if not settings.OPENAI_API_KEY", SERVICE_SOURCE)
        self.assertIn("return _fallback_content(prompt, content_type, channel)", SERVICE_SOURCE)
        self.assertIn("except Exception", SERVICE_SOURCE)

    def test_routes_are_admin_only(self):
        self.assertIn('router = APIRouter(prefix="/admin/ai"', ROUTE_SOURCE)
        self.assertGreaterEqual(ROUTE_SOURCE.count("Depends(require_admin)"), 10)
        self.assertIn('@router.get("/follow-ups"', ROUTE_SOURCE)


if __name__ == "__main__":
    main()
