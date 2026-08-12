from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.api.routes.daily_reminders import _notification_category
from app.models.enums import ContributionStatus, NotificationType, ReminderType
from app.schemas.notification import NotificationSend
from app.schemas.pledge import PledgeCreate
from app.schemas.reminder import ReminderCreate
from app.schemas.support import SupportMessageAdminUpdate, SupportMessageCreate
from app.services.notification_service import _push_preference_allows
from app.services.pledge_service import _resolve_current_month_status


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


def test_current_month_status_prefers_confirmed_then_submitted():
    assert _resolve_current_month_status([]) is None
    assert _resolve_current_month_status([ContributionStatus.rejected]) == ContributionStatus.rejected
    assert _resolve_current_month_status([
        ContributionStatus.needs_follow_up,
        ContributionStatus.submitted,
    ]) == ContributionStatus.submitted
    assert _resolve_current_month_status([
        ContributionStatus.submitted,
        ContributionStatus.confirmed,
    ]) == ContributionStatus.confirmed


def test_reminder_categories_map_to_delivery_preferences():
    dhikr = SimpleNamespace(reminder_type=ReminderType.dhikr)
    friday = SimpleNamespace(reminder_type=ReminderType.friday)
    sadaqah = SimpleNamespace(reminder_type=ReminderType.sadaqah)
    assert _notification_category(dhikr) == "dhikr"
    assert _notification_category(friday) == "friday"
    assert _notification_category(sadaqah) == "sadaqah"

    user = SimpleNamespace(
        notification_dhikr=True,
        notification_friday=True,
        notification_sadaqah=True,
    )
    assert _push_preference_allows(user, NotificationType.reminder, "dhikr") is True
    assert _push_preference_allows(user, NotificationType.reminder, "friday") is True
    assert _push_preference_allows(user, NotificationType.reminder, "sadaqah") is True


def test_dhikr_categories_are_bounded_and_shirk_is_retired():
    morning = ReminderCreate(type="dhikr", title="Morning remembrance", text="Reviewed content", dhikr_category="morning")
    assert morning.reminder_type == ReminderType.dhikr
    assert morning.dhikr_category == "morning"

    anytime = ReminderCreate(type="dhikr", title="Daily remembrance", text="Reviewed content")
    assert anytime.dhikr_category == "anytime"

    with pytest.raises(ValidationError):
        ReminderCreate(type="dhikr", title="Bad category", text="Reviewed content", dhikr_category="random")

    with pytest.raises(ValidationError):
        ReminderCreate(type="shirk", title="Retired category", text="Should not be accepted")


def test_notification_schema_does_not_accept_retired_shirk_category():
    with pytest.raises(ValidationError):
        NotificationSend(
            title="Retired",
            body="Not sendable",
            notification_type=NotificationType.reminder,
            audience="all_users",
            content_category="shirk",
        )


def test_support_payloads_are_bounded():
    request = SupportMessageCreate(subject="Pledge question", message="Please help me understand my pledge.", category="pledge")
    assert request.category == "pledge"
    update = SupportMessageAdminUpdate(status="resolved", admin_response="We checked this for you.")
    assert update.status == "resolved"

    with pytest.raises(ValidationError):
        SupportMessageCreate(subject="x", message="help", category="unknown")
