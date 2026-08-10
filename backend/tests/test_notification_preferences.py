from types import SimpleNamespace

from app.models.enums import NotificationType
from app.services.notification_service import _push_preference_allows


def user(**overrides):
    values = {
        "notification_daily": False,
        "notification_friday": False,
        "notification_campaigns": False,
        "notification_emergency": False,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_emergency_push_requires_emergency_opt_in():
    assert not _push_preference_allows(user(), NotificationType.emergency)
    assert _push_preference_allows(
        user(notification_emergency=True), NotificationType.emergency
    )


def test_campaign_and_impact_push_require_campaign_opt_in():
    opted_in = user(notification_campaigns=True)
    opted_out = user()
    assert _push_preference_allows(opted_in, NotificationType.campaign)
    assert _push_preference_allows(opted_in, NotificationType.impact)
    assert not _push_preference_allows(opted_out, NotificationType.campaign)
    assert not _push_preference_allows(opted_out, NotificationType.impact)


def test_reminder_and_pledge_push_require_daily_opt_in():
    opted_in = user(notification_daily=True)
    opted_out = user()
    assert _push_preference_allows(opted_in, NotificationType.reminder)
    assert _push_preference_allows(opted_in, NotificationType.pledge)
    assert not _push_preference_allows(opted_out, NotificationType.reminder)
    assert not _push_preference_allows(opted_out, NotificationType.pledge)


def test_system_notification_is_not_treated_as_marketing_opt_in():
    assert _push_preference_allows(user(), NotificationType.system)
