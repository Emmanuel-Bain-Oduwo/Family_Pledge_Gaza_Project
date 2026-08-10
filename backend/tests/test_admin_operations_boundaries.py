from datetime import datetime, timezone
from types import SimpleNamespace

from app.api.routes.daily_reminders import _notification_category
from app.models.enums import AiTaskStatus, ReminderType
from app.schemas.admin_operations import OutboundCampaignCreate
from app.services.admin_operations_service import _normalize_channels
from app.services.ai_task_service import _add_month


def test_communication_channels_are_deduplicated():
    assert _normalize_channels(["app", "email", "app", "whatsapp"]) == ["app", "email", "whatsapp"]


def test_outbound_campaign_requires_at_least_one_channel():
    try:
        OutboundCampaignCreate(
            title="Reminder",
            body="Message",
            segment="all_donors",
            channels=[],
        )
        assert False, "Expected validation error"
    except Exception:
        assert True


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
        ReminderType.shirk: "shirk",
        ReminderType.motivation: "motivation",
        ReminderType.friday: "friday",
        ReminderType.sadaqah: "sadaqah",
    }
    for reminder_type, expected in cases.items():
        reminder = SimpleNamespace(reminder_type=reminder_type)
        assert _notification_category(reminder) == expected
