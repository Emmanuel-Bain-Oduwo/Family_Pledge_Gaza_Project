from pathlib import Path

from app.models.enums import PaymentStatus
from app.services.payments.payment_service import ACTIVE_PAYMENT_STATUSES


def test_only_unfinished_payments_are_considered_active():
    assert ACTIVE_PAYMENT_STATUSES == {
        PaymentStatus.created,
        PaymentStatus.initiating,
        PaymentStatus.pending,
    }
    assert PaymentStatus.succeeded not in ACTIVE_PAYMENT_STATUSES
    assert PaymentStatus.failed not in ACTIVE_PAYMENT_STATUSES
    assert PaymentStatus.cancelled not in ACTIVE_PAYMENT_STATUSES
    assert PaymentStatus.expired not in ACTIVE_PAYMENT_STATUSES


def test_migration_has_database_level_active_attempt_guard():
    migration = Path("alembic/versions/0021_payment_attempt_guards.py").read_text()
    assert "uq_payment_active_monthly_pledge" in migration
    assert "status IN ('created','initiating','pending')" in migration


def test_success_settlement_requires_receipt_and_amount_match():
    source = Path("app/services/payments/payment_service.py").read_text()
    assert "missing_receipt" in source
    assert "amount_mismatch" in source
    assert "duplicate_receipt" in source
    assert "payment_transaction_id=locked.id" in source
    assert "status=ContributionStatus.confirmed" in source
