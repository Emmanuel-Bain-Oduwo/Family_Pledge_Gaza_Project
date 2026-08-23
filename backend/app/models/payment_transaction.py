import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin
from .enums import PaymentStatus


class PaymentTransaction(Base, TimestampMixin):
    """Provider-facing payment attempt ledger.

    A payment attempt can fail, expire, or be cancelled without creating a
    Contribution. Only a successfully settled payment is linked one-to-one to a
    confirmed Contribution.
    """

    __tablename__ = "payment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    pledge_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pledges.id", ondelete="SET NULL"), nullable=True
    )
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )

    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="mpesa")
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False, default="stk_push")
    purpose: Mapped[str] = mapped_column(String(64), nullable=False, default="monthly_pledge")
    contribution_month: Mapped[str] = mapped_column(String(7), nullable=False)

    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"),
        nullable=False,
        default=PaymentStatus.created,
    )

    requested_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    requested_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    settlement_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    settlement_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="KES")
    fx_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 6), nullable=True)

    payer_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    internal_reference: Mapped[str] = mapped_column(String(64), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)

    merchant_request_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    checkout_request_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    provider_transaction_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    mpesa_receipt_number: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    provider_result_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    provider_result_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    initiated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_payment_transactions_idempotency_key"),
        UniqueConstraint("checkout_request_id", name="uq_payment_transactions_checkout_request_id"),
        UniqueConstraint("mpesa_receipt_number", name="uq_payment_transactions_mpesa_receipt"),
        Index("ix_payment_transactions_user_id", "user_id"),
        Index("ix_payment_transactions_pledge_id", "pledge_id"),
        Index("ix_payment_transactions_campaign_id", "campaign_id"),
        Index("ix_payment_transactions_month", "contribution_month"),
        Index("ix_payment_transactions_status", "status"),
        Index("ix_payment_transactions_internal_reference", "internal_reference"),
    )
