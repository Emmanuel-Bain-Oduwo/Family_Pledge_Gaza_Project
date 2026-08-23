import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.contribution import Contribution
from app.models.enums import ContributionStatus, PaymentStatus, PledgeStatus
from app.models.payment_transaction import PaymentTransaction
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.payment import MpesaInitiateIn
from app.services import contribution_service
from app.utils.validators import current_month


ACTIVE_PAYMENT_STATUSES = {
    PaymentStatus.created,
    PaymentStatus.initiating,
    PaymentStatus.pending,
}
TERMINAL_PAYMENT_STATUSES = {
    PaymentStatus.succeeded,
    PaymentStatus.failed,
    PaymentStatus.cancelled,
    PaymentStatus.expired,
}


def normalize_ke_phone(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif digits.startswith("7") and len(digits) == 9:
        digits = "254" + digits
    elif digits.startswith("1") and len(digits) == 9:
        digits = "254" + digits
    if not digits.startswith("254") or len(digits) != 12:
        raise HTTPException(400, "Enter a valid Kenyan M-PESA phone number")
    if digits[3] not in {"7", "1"}:
        raise HTTPException(400, "Enter a valid Kenyan M-PESA phone number")
    return digits


def _kes_amount_for_pledge(pledge: Pledge) -> tuple[Decimal, Decimal | None]:
    amount = Decimal(str(pledge.amount))
    currency = pledge.currency.strip().upper()
    if amount <= 0:
        raise HTTPException(400, "This pledge does not require a payment")
    if currency == "KES":
        return amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP), None
    if currency != "USD":
        raise HTTPException(400, f"M-PESA checkout does not support {currency} pledges yet")
    rate = Decimal(str(settings.MPESA_USD_KES_RATE))
    if rate <= 0:
        raise HTTPException(503, "M-PESA USD to KES rate is not configured")
    settlement = (amount * rate).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    if settlement < 1:
        settlement = Decimal("1")
    return settlement, rate


def get_owned_pledge(db: Session, user: User, pledge_id: uuid.UUID) -> Pledge:
    pledge = db.scalar(
        select(Pledge).where(
            Pledge.id == pledge_id,
            Pledge.user_id == user.id,
            Pledge.status == PledgeStatus.active,
        )
    )
    if not pledge:
        raise HTTPException(404, "Active pledge not found")
    return pledge


def _active_monthly_payment(
    db: Session, *, user_id: uuid.UUID, pledge_id: uuid.UUID, month: str
) -> PaymentTransaction | None:
    return db.scalar(
        select(PaymentTransaction)
        .where(
            PaymentTransaction.user_id == user_id,
            PaymentTransaction.pledge_id == pledge_id,
            PaymentTransaction.contribution_month == month,
            PaymentTransaction.purpose == "monthly_pledge",
            PaymentTransaction.status.in_(tuple(ACTIVE_PAYMENT_STATUSES)),
        )
        .order_by(PaymentTransaction.created_at.desc())
        .limit(1)
    )


def _succeeded_monthly_payment(
    db: Session, *, user_id: uuid.UUID, pledge_id: uuid.UUID, month: str
) -> PaymentTransaction | None:
    return db.scalar(
        select(PaymentTransaction)
        .where(
            PaymentTransaction.user_id == user_id,
            PaymentTransaction.pledge_id == pledge_id,
            PaymentTransaction.contribution_month == month,
            PaymentTransaction.purpose == "monthly_pledge",
            PaymentTransaction.status == PaymentStatus.succeeded,
        )
        .order_by(PaymentTransaction.paid_at.desc().nullslast())
        .limit(1)
    )


def _confirmed_monthly_contribution(
    db: Session, *, user_id: uuid.UUID, pledge_id: uuid.UUID, month: str
) -> Contribution | None:
    return db.scalar(
        select(Contribution)
        .where(
            Contribution.user_id == user_id,
            Contribution.pledge_id == pledge_id,
            Contribution.contribution_month == month,
            Contribution.status == ContributionStatus.confirmed,
        )
        .order_by(Contribution.created_at.desc())
        .limit(1)
    )


def create_mpesa_payment(
    db: Session,
    user: User,
    data: MpesaInitiateIn,
) -> tuple[PaymentTransaction, bool]:
    existing = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.idempotency_key == data.idempotency_key
        )
    )
    if existing:
        if existing.user_id != user.id:
            raise HTTPException(409, "This payment request key is already in use")
        return existing, False

    pledge = get_owned_pledge(db, user, data.pledge_id)
    month = data.contribution_month or current_month()

    succeeded = _succeeded_monthly_payment(
        db, user_id=user.id, pledge_id=pledge.id, month=month
    )
    if succeeded or _confirmed_monthly_contribution(
        db, user_id=user.id, pledge_id=pledge.id, month=month
    ):
        raise HTTPException(409, "This month's pledge contribution is already paid")

    active = _active_monthly_payment(
        db, user_id=user.id, pledge_id=pledge.id, month=month
    )
    if active:
        return active, False

    phone = normalize_ke_phone(data.phone)
    settlement_amount, fx_rate = _kes_amount_for_pledge(pledge)
    requested_amount = Decimal(str(pledge.amount))
    requested_currency = pledge.currency.strip().upper()
    internal_reference = f"FP{uuid.uuid4().hex[:10].upper()}"
    now = datetime.now(timezone.utc)

    payment = PaymentTransaction(
        user_id=user.id,
        pledge_id=pledge.id,
        campaign_id=data.campaign_id,
        provider="mpesa",
        payment_method="stk_push",
        purpose="monthly_pledge",
        contribution_month=month,
        status=PaymentStatus.created,
        requested_amount=requested_amount,
        requested_currency=requested_currency,
        settlement_amount=settlement_amount,
        settlement_currency="KES",
        fx_rate=fx_rate,
        payer_phone=phone,
        internal_reference=internal_reference,
        idempotency_key=data.idempotency_key,
        expires_at=now + timedelta(minutes=settings.MPESA_PAYMENT_TTL_MINUTES),
    )
    db.add(payment)
    try:
        db.commit()
    except IntegrityError:
        # The partial unique DB index is the final guard for two simultaneous
        # initiations that race past the application-level lookup.
        db.rollback()
        concurrent = _active_monthly_payment(
            db, user_id=user.id, pledge_id=pledge.id, month=month
        )
        if concurrent:
            return concurrent, False
        duplicate_key = db.scalar(
            select(PaymentTransaction).where(
                PaymentTransaction.idempotency_key == data.idempotency_key
            )
        )
        if duplicate_key and duplicate_key.user_id == user.id:
            return duplicate_key, False
        raise
    db.refresh(payment)
    return payment, True


def get_payment_for_user(db: Session, payment_id: uuid.UUID, user_id: uuid.UUID) -> PaymentTransaction:
    payment = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.id == payment_id,
            PaymentTransaction.user_id == user_id,
        )
    )
    if not payment:
        raise HTTPException(404, "Payment not found")
    return payment


def get_payment_by_checkout(db: Session, checkout_request_id: str) -> PaymentTransaction | None:
    return db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.checkout_request_id == checkout_request_id
        )
    )


def mark_initiating(db: Session, payment: PaymentTransaction) -> PaymentTransaction:
    if payment.status not in {PaymentStatus.created, PaymentStatus.initiating}:
        return payment
    payment.status = PaymentStatus.initiating
    payment.initiated_at = payment.initiated_at or datetime.now(timezone.utc)
    db.commit()
    db.refresh(payment)
    return payment


def mark_stk_accepted(
    db: Session,
    payment: PaymentTransaction,
    *,
    merchant_request_id: str | None,
    checkout_request_id: str | None,
    response_description: str | None,
) -> PaymentTransaction:
    if payment.status == PaymentStatus.succeeded:
        return payment
    payment.merchant_request_id = merchant_request_id or payment.merchant_request_id
    payment.checkout_request_id = checkout_request_id or payment.checkout_request_id
    payment.provider_result_description = response_description
    payment.status = PaymentStatus.pending
    db.commit()
    db.refresh(payment)
    return payment


def mark_provider_error(
    db: Session,
    payment: PaymentTransaction,
    *,
    code: str | None,
    description: str,
) -> PaymentTransaction:
    if payment.status == PaymentStatus.succeeded:
        return payment
    payment.provider_result_code = code
    payment.provider_result_description = description[:2000]
    payment.status = PaymentStatus.failed
    db.commit()
    db.refresh(payment)
    return payment


def settle_successful_callback(
    db: Session,
    payment: PaymentTransaction,
    *,
    callback_amount,
    receipt_number: str | None,
    result_description: str | None,
) -> PaymentTransaction:
    locked = db.scalar(
        select(PaymentTransaction)
        .where(PaymentTransaction.id == payment.id)
        .with_for_update()
    )
    if not locked:
        raise HTTPException(404, "Payment not found")

    existing_contribution = db.scalar(
        select(Contribution).where(
            Contribution.payment_transaction_id == locked.id
        )
    )
    if locked.status == PaymentStatus.succeeded:
        # Callback retry: the first callback already committed the payment and
        # contribution. Returning the existing row makes callback processing idempotent.
        return locked

    receipt = (receipt_number or "").strip()
    if not receipt:
        locked.status = PaymentStatus.failed
        locked.provider_result_code = "missing_receipt"
        locked.provider_result_description = "Successful callback did not include an M-PESA receipt number"
        db.commit()
        db.refresh(locked)
        return locked

    try:
        received_amount = Decimal(str(callback_amount))
        expected_amount = Decimal(str(locked.settlement_amount))
    except (InvalidOperation, TypeError, ValueError):
        received_amount = Decimal("-1")
        expected_amount = Decimal(str(locked.settlement_amount or 0))

    if received_amount != expected_amount:
        locked.status = PaymentStatus.failed
        locked.provider_result_code = "amount_mismatch"
        locked.provider_result_description = (
            f"Provider confirmed KES {received_amount} but checkout expected KES {expected_amount}"
        )
        db.commit()
        db.refresh(locked)
        return locked

    duplicate_receipt = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.mpesa_receipt_number == receipt,
            PaymentTransaction.id != locked.id,
        )
    )
    if duplicate_receipt:
        locked.status = PaymentStatus.failed
        locked.provider_result_code = "duplicate_receipt"
        locked.provider_result_description = "M-PESA receipt was already recorded for another payment"
        db.commit()
        db.refresh(locked)
        return locked

    now = datetime.now(timezone.utc)
    locked.status = PaymentStatus.succeeded
    locked.provider_result_code = "0"
    locked.provider_result_description = result_description or "M-PESA payment received"
    locked.mpesa_receipt_number = receipt
    locked.provider_transaction_id = receipt
    locked.paid_at = now

    if not existing_contribution:
        contribution = Contribution(
            user_id=locked.user_id,
            pledge_id=locked.pledge_id,
            campaign_id=locked.campaign_id,
            payment_transaction_id=locked.id,
            amount=locked.requested_amount,
            currency=locked.requested_currency,
            contribution_channel="mpesa",
            transaction_reference=receipt,
            status=ContributionStatus.confirmed,
            contribution_month=locked.contribution_month,
            confirmed_by=None,
            confirmed_at=now,
        )
        db.add(contribution)
        db.flush()
        contribution_service.sync_campaign_totals(db, locked.campaign_id)

    db.commit()
    db.refresh(locked)
    return locked


def record_callback_result(
    db: Session,
    payment: PaymentTransaction,
    *,
    result_code: str,
    result_description: str | None,
    callback_amount=None,
    receipt_number: str | None = None,
) -> PaymentTransaction:
    if payment.status == PaymentStatus.succeeded:
        return payment
    if result_code == "0":
        return settle_successful_callback(
            db,
            payment,
            callback_amount=callback_amount,
            receipt_number=receipt_number,
            result_description=result_description,
        )

    payment.provider_result_code = result_code
    payment.provider_result_description = result_description
    payment.status = (
        PaymentStatus.cancelled if result_code == "1032" else PaymentStatus.failed
    )
    db.commit()
    db.refresh(payment)
    return payment
