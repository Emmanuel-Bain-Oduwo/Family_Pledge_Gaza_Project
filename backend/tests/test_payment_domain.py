from app.models.enums import PaymentStatus
from app.models.payment_transaction import PaymentTransaction


def test_payment_status_lifecycle_values_are_stable():
    assert [status.value for status in PaymentStatus] == [
        "created",
        "initiating",
        "pending",
        "succeeded",
        "failed",
        "cancelled",
        "expired",
    ]


def test_payment_transaction_has_idempotency_and_provider_uniqueness():
    constraint_names = {
        constraint.name
        for constraint in PaymentTransaction.__table__.constraints
        if constraint.name
    }
    assert "uq_payment_transactions_idempotency_key" in constraint_names
    assert "uq_payment_transactions_checkout_request_id" in constraint_names
    assert "uq_payment_transactions_mpesa_receipt" in constraint_names
