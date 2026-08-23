from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import PaymentStatus


class MpesaInitiateIn(BaseModel):
    pledge_id: UUID
    phone: str = Field(min_length=9, max_length=32)
    campaign_id: UUID | None = None
    contribution_month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    idempotency_key: str = Field(min_length=8, max_length=128)


class PaymentOut(BaseModel):
    id: UUID
    user_id: UUID
    pledge_id: UUID | None
    campaign_id: UUID | None
    provider: str
    payment_method: str
    purpose: str
    contribution_month: str
    status: PaymentStatus
    requested_amount: Decimal
    requested_currency: str
    settlement_amount: Decimal | None
    settlement_currency: str
    fx_rate: Decimal | None
    payer_phone: str
    internal_reference: str
    merchant_request_id: str | None
    checkout_request_id: str | None
    mpesa_receipt_number: str | None
    provider_result_code: str | None
    provider_result_description: str | None
    initiated_at: datetime | None
    paid_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MpesaInitiateOut(BaseModel):
    payment: PaymentOut
    customer_message: str


class MpesaCallbackAck(BaseModel):
    received: bool = True
