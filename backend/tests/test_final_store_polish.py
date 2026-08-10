from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.api.routes.daily_reminders import _notification_category
from app.models.enums import NotificationType, ReminderType
from app.schemas.pledge import PledgeCreate
from app.schemas.support import SupportMessageAdminUpdate, SupportMessageCreate
from app.services.notification_service import _push_preference_allows


def test_pledge_requires_explicit_agreement():
    with pytest.raises(ValidationError):
        PledgeCreate(start_date="2026-08-10", amount=10, currency="USD")

    pledge = PledgeCreate(
        start_date="2026-08-10",
        amount=10,
        currency="USD",
        agreement_accepted=True,
    )
    assert pledge.agreement_accepted is True


def test_new_reminder_categories_map_to_delivery_preferences():
    dhikr = SimpleNamespace(reminder_type=ReminderType.dhikr)
    shirk = SimpleNamespace(reminder_type=ReminderType.shirk)
    friday = SimpleNamespace(reminder_type=ReminderType.friday)
    sadaqah = SimpleNamespace(reminder_type=ReminderType.sadaqah)
    assert _notification_category(dhikr) == "dhikr"
    assert _notification_category(shirk) == "shirk"
    assert _notification_category(friday) == "friday"
    assert _notification_category(sadaqah) == "sadaqah"

    user = SimpleNamespace(
        notification_dhikr=True,
        notification_shirk=False,
        notification_friday=True,
        notification_sadaqah=True,
    )
    assert _push_preference_allows(user, NotificationType.reminder, "dhikr") is True
    assert _push_preference_allows(user, NotificationType.reminder, "shirk") is False
    assert _push_preference_allows(user, NotificationType.reminder, "friday") is True
    assert _push_preference_allows(user, NotificationType.reminder, "sadaqah") is True


def test_support_payloads_are_bounded():
    request = SupportMessageCreate(subject="Pledge question", message="Please help me understand my pledge.", category="pledge")
    assert request.category == "pledge"
    update = SupportMessageAdminUpdate(status="resolved", admin_response="We checked this for you.")
    assert update.status == "resolved"

    with pytest.raises(ValidationError):
        SupportMessageCreate(subject="x", message="help", category="unknown")
