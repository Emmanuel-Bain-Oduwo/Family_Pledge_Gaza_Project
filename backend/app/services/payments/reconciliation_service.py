from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import PaymentStatus
from app.models.payment_transaction import PaymentTransaction
from app.services.payments import mpesa_service, payment_service


ACTIVE_STATUSES = (
    PaymentStatus.created,
    PaymentStatus.initiating,
    PaymentStatus.pending,
)


def reconcile_batch(db: Session) -> dict[str, int]:
    """Reconcile a bounded batch without guessing successful money movement.

    A query may resolve failed/cancelled requests. A successful query without a
    receipt remains locked pending because only a receipt-bearing callback (or a
    future query response that includes receipt + amount) may create the
    confirmed contribution.
    """
    now = datetime.now(timezone.utc)
    query_cutoff = now - timedelta(seconds=settings.MPESA_QUERY_AFTER_SECONDS)
    payments = list(
        db.scalars(
            select(PaymentTransaction)
            .where(
                PaymentTransaction.status.in_(ACTIVE_STATUSES),
                PaymentTransaction.created_at <= query_cutoff,
            )
            .order_by(PaymentTransaction.created_at.asc())
            .limit(settings.MPESA_RECONCILIATION_BATCH_SIZE)
        ).all()
    )

    stats = {"checked": 0, "failed": 0, "cancelled": 0, "expired": 0, "pending": 0, "succeeded": 0, "errors": 0}
    for payment in payments:
        stats["checked"] += 1

        if not payment.checkout_request_id:
            if payment.expires_at and payment.expires_at <= now:
                payment.status = PaymentStatus.expired
                payment.provider_result_code = payment.provider_result_code or "request_expired"
                payment.provider_result_description = payment.provider_result_description or "M-PESA request expired before a checkout identifier was confirmed"
                db.commit()
                stats["expired"] += 1
            else:
                stats["pending"] += 1
            continue

        try:
            result = mpesa_service.query_stk_status(payment.checkout_request_id)
        except mpesa_service.DarajaError:
            db.rollback()
            stats["errors"] += 1
            continue

        result_code_raw = result.get("ResultCode")
        if result_code_raw is None:
            payment.provider_result_description = str(
                result.get("ResponseDescription")
                or result.get("ResultDesc")
                or "M-PESA status query is still pending"
            )[:2000]
            db.commit()
            stats["pending"] += 1
            continue

        result_code = str(result_code_raw)
        result_desc = str(result.get("ResultDesc") or result.get("ResponseDescription") or "")
        if result_code == "0":
            receipt = result.get("MpesaReceiptNumber") or result.get("M-PesaReceiptNumber")
            amount = result.get("Amount")
            if receipt and amount is not None:
                payment_service.record_callback_result(
                    db,
                    payment,
                    result_code="0",
                    result_description=result_desc or "M-PESA payment reconciled by status query",
                    callback_amount=amount,
                    receipt_number=str(receipt),
                )
                stats["succeeded"] += 1
            else:
                # A success response without a receipt is not enough to create
                # an accounting contribution. Keep the payment locked so an
                # immediate retry cannot cause a duplicate charge.
                payment.status = PaymentStatus.pending
                payment.provider_result_code = "query_success_waiting_receipt"
                payment.provider_result_description = (
                    result_desc or "M-PESA reports success; waiting for receipt-bearing callback"
                )[:2000]
                payment.expires_at = max(
                    payment.expires_at or now,
                    now + timedelta(hours=24),
                )
                db.commit()
                stats["pending"] += 1
            continue

        payment_service.record_callback_result(
            db,
            payment,
            result_code=result_code,
            result_description=result_desc,
        )
        if payment.status == PaymentStatus.cancelled:
            stats["cancelled"] += 1
        elif payment.status == PaymentStatus.failed:
            stats["failed"] += 1
        else:
            stats["pending"] += 1

    return stats
