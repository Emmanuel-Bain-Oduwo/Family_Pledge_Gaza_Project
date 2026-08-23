import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import PaymentStatus, PledgeStatus
from app.models.payment_transaction import PaymentTransaction
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.payment import MpesaInitiateIn
from app.utils.validators import current_month


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
    db.commit()
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
    payment.status = PaymentStatus.initiating
    payment.initiated_at = datetime.now(timezone.utc)
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
    payment.merchant_request_id = merchant_request_id
    payment.checkout_request_id = checkout_request_id
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
    payment.provider_result_code = code
    payment.provider_result_description = description[:2000]
    payment.status = PaymentStatus.failed
    db.commit()
    db.refresh(payment)
    return payment


def record_callback_result(
    db: Session,
    payment: PaymentTransaction,
    *,
    result_code: str,
    result_description: str | None,
) -> PaymentTransaction:
    if payment.status == PaymentStatus.succeeded:
        return payment
    payment.provider_result_code = result_code
    payment.provider_result_description = result_description
    if result_code == "0":
        # PR 3 upgrades this path to atomic contribution settlement.
        payment.status = PaymentStatus.succeeded
        payment.paid_at = datetime.now(timezone.utc)
    elif result_code == "1032":
        payment.status = PaymentStatus.cancelled
    else:
        payment.status = PaymentStatus.failed
    db.commit()
    db.refresh(payment)
    return payment
