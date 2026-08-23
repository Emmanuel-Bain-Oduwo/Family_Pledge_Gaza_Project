import logging
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.enums import PaymentStatus
from app.models.payment_transaction import PaymentTransaction
from app.models.user import User
from app.schemas.payment import MpesaCallbackAck, MpesaInitiateIn, MpesaInitiateOut, PaymentOut
from app.services.payments import mpesa_service, payment_service


log = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/mpesa/initiate", response_model=MpesaInitiateOut)
def initiate_mpesa_payment(
    body: MpesaInitiateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment, created = payment_service.create_mpesa_payment(db, current_user, body)
    if not created:
        return MpesaInitiateOut(
            payment=PaymentOut.model_validate(payment),
            customer_message=_message_for_status(payment.status),
        )

    payment_service.mark_initiating(db, payment)
    try:
        result = mpesa_service.initiate_stk_push(
            phone=payment.payer_phone,
            amount_kes=int(Decimal(payment.settlement_amount or 0)),
            account_reference=payment.internal_reference,
        )
    except mpesa_service.DarajaError as exc:
        payment_service.mark_provider_error(
            db,
            payment,
            code=exc.code,
            description=str(exc),
        )
        raise HTTPException(502, "M-PESA could not start the payment request. Please try again.") from exc

    payment_service.mark_stk_accepted(
        db,
        payment,
        merchant_request_id=_optional_string(result.get("MerchantRequestID")),
        checkout_request_id=_optional_string(result.get("CheckoutRequestID")),
        response_description=_optional_string(
            result.get("CustomerMessage") or result.get("ResponseDescription")
        ),
    )
    return MpesaInitiateOut(
        payment=PaymentOut.model_validate(payment),
        customer_message=str(
            result.get("CustomerMessage")
            or "M-PESA request sent. Complete the prompt on your phone."
        ),
    )


@router.get("/me", response_model=list[PaymentOut])
def get_my_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(PaymentTransaction)
            .where(PaymentTransaction.user_id == current_user.id)
            .order_by(PaymentTransaction.created_at.desc())
            .limit(100)
        ).all()
    )


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return payment_service.get_payment_for_user(db, payment_id, current_user.id)


@router.post("/mpesa/callback", response_model=MpesaCallbackAck)
def mpesa_callback(
    payload: dict,
    db: Session = Depends(get_db),
):
    try:
        parsed = mpesa_service.parse_stk_callback(payload)
    except mpesa_service.DarajaError:
        log.warning("Rejected malformed M-PESA callback")
        raise HTTPException(400, "Invalid M-PESA callback payload")

    payment = payment_service.get_payment_by_checkout(
        db, parsed["checkout_request_id"]
    )
    if payment is None:
        log.warning(
            "Received M-PESA callback for unknown checkout id %s",
            parsed["checkout_request_id"],
        )
        return MpesaCallbackAck()

    if parsed.get("merchant_request_id") and not payment.merchant_request_id:
        payment.merchant_request_id = parsed["merchant_request_id"]

    payment_service.record_callback_result(
        db,
        payment,
        result_code=parsed["result_code"],
        result_description=parsed.get("result_description"),
        callback_amount=parsed.get("amount"),
        receipt_number=_optional_string(parsed.get("mpesa_receipt_number")),
    )
    return MpesaCallbackAck()


def _optional_string(value) -> str | None:
    return str(value) if value not in (None, "") else None


def _message_for_status(status: PaymentStatus) -> str:
    if status == PaymentStatus.succeeded:
        return "This payment has already been received."
    if status in {PaymentStatus.created, PaymentStatus.initiating, PaymentStatus.pending}:
        return "An M-PESA payment request is already in progress."
    return "This payment attempt is closed. Start a new request to try again."
