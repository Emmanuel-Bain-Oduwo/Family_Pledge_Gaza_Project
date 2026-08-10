from datetime import datetime, timezone
from types import SimpleNamespace

from app.api.routes.daily_reminders import _notification_category
from app.models.enums import ReminderType
from app.schemas.admin_operations import OutboundCampaignCreate
from app.services.admin_operations_service import _consecutive_months
from app.services.ai_task_service import _add_month
from app.services.communication_channels import send_email_reminder, send_whatsapp_reminder


def test_consecutive_months_handles_duplicates_and_breaks():
    assert _consecutive_months(["2026-08", "2026-07", "2026-07", "2026-06", "2026-03"]) == 3
    assert _consecutive_months([]) == 0
    assert _consecutive_months(["bad", "2026-08"]) == 1


def test_outbound_channels_are_deduplicated():
    payload = OutboundCampaignCreate(
        title="Monthly reminder",
        body="Thank you for staying connected with Family Pledge.",
        segment="missing_this_month",
        channels=["app", "email", "app"],
    )
    assert payload.channels == ["app", "email"]


def test_email_delivery_requires_explicit_opt_in_before_provider_call():
    user = SimpleNamespace(id="u1", email="donor@example.com", email_reminders_opt_in=False)
    ok, error = send_email_reminder(user, "Hello", "Reminder")
    assert ok is False
    assert "consent" in (error or "").lower()


def test_whatsapp_delivery_requires_explicit_opt_in_before_provider_call():
    user = SimpleNamespace(id="u1", phone="+254700000001", whatsapp_reminders_opt_in=False)
    ok, error = send_whatsapp_reminder(user, "Hello", "Reminder")
    assert ok is False
    assert "consent" in (error or "").lower()


def test_monthly_ai_schedule_preserves_day_when_possible():
    start = datetime(2026, 8, 10, 9, 30, tzinfo=timezone.utc)
    next_run = _add_month(start)
    assert (next_run.year, next_run.month, next_run.day, next_run.hour) == (2026, 9, 10, 9)


def test_monthly_ai_schedule_clamps_end_of_month():
    start = datetime(2026, 1, 31, 9, 30, tzinfo=timezone.utc)
    next_run = _add_month(start)
    assert (next_run.year, next_run.month, next_run.day) == (2026, 2, 28)


def test_religious_publish_category_matches_user_preferences():
    cases = {
        ReminderType.quran: "quran",
        ReminderType.hadith: "hadith",
        ReminderType.dua: "dua",
        ReminderType.dhikr: "dhikr",
        ReminderType.motivation: "motivation",
        ReminderType.friday: "friday",
        ReminderType.sadaqah: "sadaqah",
    }
    for reminder_type, expected in cases.items():
        reminder = SimpleNamespace(reminder_type=reminder_type)
        assert _notification_category(reminder) == expected
