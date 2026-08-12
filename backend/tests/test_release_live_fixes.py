from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.models.enums import NotificationAudience, NotificationType, UserRole
from app.schemas.contribution import ContributionSubmit
from app.services.notification_service import list_for_user


class _ScalarList:
    def __init__(self, items):
        self._items = items

    def all(self):
        return list(self._items)


class FakeNotificationSession:
    def __init__(self, notifications, confirmed_id=None):
        self.notifications = notifications
        self.confirmed_id = confirmed_id

    def scalar(self, _statement):
        return self.confirmed_id

    def scalars(self, _statement):
        return _ScalarList(self.notifications)


def donor(**overrides):
    values = {
        "id": uuid4(),
        "role": UserRole.donor,
        "notification_daily": False,
        "notification_friday": False,
        "notification_campaigns": False,
        "notification_emergency": False,
        "notification_quran": False,
        "notification_hadith": False,
        "notification_dua": False,
        "notification_dhikr": False,
        "notification_sadaqah": False,
        "notification_motivation": False,
        "notification_impact": False,
        "notification_humanitarian": False,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def notification(category, *, audience=NotificationAudience.all_users):
    return SimpleNamespace(
        id=uuid4(),
        notification_type=NotificationType.reminder,
        content_category=category,
        audience=audience,
        created_at=datetime.now(timezone.utc),
    )


def test_contribution_currency_is_normalized_for_dashboard_accounting():
    payload = ContributionSubmit(
        amount=10,
        currency=" usd ",
        contribution_month="2026-08",
    )
    assert payload.currency == "USD"


def test_in_app_notification_feed_respects_category_opt_in():
    quran = notification("quran")
    motivation = notification("motivation")
    db = FakeNotificationSession([quran, motivation])
    items, total = list_for_user(db, donor(notification_quran=True), 0, 20)
    assert total == 1
    assert items == [quran]


def test_confirmed_donor_notification_audience_can_be_returned():
    confirmed = notification("campaign", audience=NotificationAudience.confirmed_donors)
    db = FakeNotificationSession([confirmed], confirmed_id=uuid4())
    items, total = list_for_user(db, donor(notification_campaigns=True), 0, 20)
    assert total == 1
    assert items == [confirmed]
