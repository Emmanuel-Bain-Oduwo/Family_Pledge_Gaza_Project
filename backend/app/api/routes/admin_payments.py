from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.enums import PaymentStatus
from app.models.payment_transaction import PaymentTransaction
from app.models.user import User
from app.schemas.common import PaginatedResponse, make_page
from app.schemas.payment import PaymentOut
from app.utils.pagination import offset_limit
from app.utils.validators import current_month


router = APIRouter(prefix="/admin/payments", tags=["Admin Payments"])


class AdminPaymentOut(PaymentOut):
    donor_name: str
    donor_phone: str | None = None


class PaymentSummaryOut(BaseModel):
    total: int
    this_month: int
    succeeded: int
    pending: int
    failed: int
    cancelled: int
    expired: int
    settled_kes: Decimal


def _admin_payment_out(payment: PaymentTransaction, donor: User | None) -> AdminPaymentOut:
    payload = PaymentOut.model_validate(payment).model_dump()
    payload["donor_name"] = (donor.full_name if donor else None) or "Unknown donor"
    payload["donor_phone"] = donor.phone if donor else None
    return AdminPaymentOut(**payload)


@router.get("", response_model=PaginatedResponse[AdminPaymentOut])
def list_payments(
    status: PaymentStatus | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    del admin
    skip, limit = offset_limit(page, size)
    query = select(PaymentTransaction)
    if status:
        query = query.where(PaymentTransaction.status == status)
    total = int(db.scalar(select(func.count()).select_from(query.subquery())) or 0)
    payments = list(
        db.scalars(
            query.order_by(PaymentTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()
    )
    user_ids = {payment.user_id for payment in payments}
    donors = {
        donor.id: donor
        for donor in db.scalars(select(User).where(User.id.in_(user_ids))).all()
    } if user_ids else {}
    return make_page(
        [_admin_payment_out(payment, donors.get(payment.user_id)) for payment in payments],
        total,
        page,
        size,
    )


@router.get("/summary", response_model=PaymentSummaryOut)
def payment_summary(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    del admin
    month = current_month()
    counts = {
        status: int(
            db.scalar(
                select(func.count(PaymentTransaction.id)).where(
                    PaymentTransaction.status == status
                )
            ) or 0
        )
        for status in PaymentStatus
    }
    total = int(db.scalar(select(func.count(PaymentTransaction.id))) or 0)
    this_month = int(
        db.scalar(
            select(func.count(PaymentTransaction.id)).where(
                PaymentTransaction.contribution_month == month
            )
        ) or 0
    )
    settled_kes = db.scalar(
        select(func.coalesce(func.sum(PaymentTransaction.settlement_amount), 0)).where(
            PaymentTransaction.status == PaymentStatus.succeeded,
            func.upper(func.trim(PaymentTransaction.settlement_currency)) == "KES",
        )
    ) or Decimal("0")
    pending = sum(
        counts[status]
        for status in (PaymentStatus.created, PaymentStatus.initiating, PaymentStatus.pending)
    )
    return PaymentSummaryOut(
        total=total,
        this_month=this_month,
        succeeded=counts[PaymentStatus.succeeded],
        pending=pending,
        failed=counts[PaymentStatus.failed],
        cancelled=counts[PaymentStatus.cancelled],
        expired=counts[PaymentStatus.expired],
        settled_kes=Decimal(str(settled_kes)),
    )


@router.get("/{payment_id}", response_model=AdminPaymentOut)
def payment_detail(
    payment_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    del admin
    payment = db.get(PaymentTransaction, payment_id)
    if not payment:
        from fastapi import HTTPException
        raise HTTPException(404, "Payment not found")
    donor = db.get(User, payment.user_id)
    return _admin_payment_out(payment, donor)
