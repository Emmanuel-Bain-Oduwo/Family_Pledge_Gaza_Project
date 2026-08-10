from types import SimpleNamespace

from app.models.enums import NotificationType
from app.services.engagement_service import _month_streak
from app.services.notification_service import _push_preference_allows


def _user(**changes):
    values = {
        "notification_daily": False,
        "notification_friday": False,
        "notification_campaigns": False,
        "notification_emergency": False,
        "notification_quran": False,
        "notification_hadith": False,
        "notification_dua": False,
        "notification_motivation": False,
        "notification_impact": False,
        "notification_humanitarian": False,
    }
    values.update(changes)
    return SimpleNamespace(**values)


def test_month_streak_finds_longest_run():
    current, longest = _month_streak(["2025-01", "2025-02", "2025-03", "2025-06", "2025-07"])
    assert current >= 0
    assert longest == 3


def test_quran_push_requires_quran_opt_in():
    assert not _push_preference_allows(_user(), NotificationType.reminder, "quran")
    assert _push_preference_allows(_user(notification_quran=True), NotificationType.reminder, "quran")


def test_humanitarian_and_impact_are_independent_categories():
    user = _user(notification_humanitarian=True, notification_impact=False)
    assert _push_preference_allows(user, NotificationType.campaign, "humanitarian")
    assert not _push_preference_allows(user, NotificationType.impact, "impact")


def test_emergency_still_requires_emergency_opt_in():
    assert not _push_preference_allows(_user(), NotificationType.emergency, "emergency")
    assert _push_preference_allows(_user(notification_emergency=True), NotificationType.emergency, "emergency")
