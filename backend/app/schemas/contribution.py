from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.enums import ContributionStatus


class ContributionSubmit(BaseModel):
    pledge_id: Optional[UUID] = None
    campaign_id: Optional[UUID] = None
    amount: Optional[float] = None
    currency: str = "USD"
    contribution_channel: Optional[str] = None
    payment_link_used: Optional[str] = None
    transaction_reference: Optional[str] = None
    # New uploads use a private R2 object key. proof_image_url remains accepted
    # temporarily for legacy clients/data migration only and is never generated
    # by the current donor application.
    proof_object_key: Optional[str] = None
    proof_image_url: Optional[str] = None
    contribution_month: str  # YYYY-MM

    @model_validator(mode="before")
    @classmethod
    def accept_mobile_legacy_aliases(cls, data):
        if isinstance(data, dict):
            aliases = {
                "reference": "transaction_reference",
                "proof_url": "proof_image_url",
                "payment_method": "contribution_channel",
            }
            for old, new in aliases.items():
                if old in data and new not in data:
                    data[new] = data[old]
        return data

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        normalized = (value or "USD").strip().upper()
        if len(normalized) != 3 or not normalized.isalpha():
            raise ValueError("currency must be a 3-letter code")
        return normalized

    @field_validator("contribution_month")
    @classmethod
    def validate_month(cls, v: str) -> str:
        import re

        if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v):
            raise ValueError("contribution_month must be YYYY-MM format")
        return v

    @field_validator("proof_object_key")
    @classmethod
    def validate_private_proof_key(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value.startswith("family-pledge-private/contribution_proofs/"):
            raise ValueError("Invalid private contribution-proof reference")
        return value


class ContributionOut(BaseModel):
    id: UUID
    user_id: UUID
    pledge_id: Optional[UUID] = None
    campaign_id: Optional[UUID] = None
    amount: Optional[float] = None
    currency: str
    contribution_channel: Optional[str] = None
    payment_link_used: Optional[str] = None
    transaction_reference: Optional[str] = None
    # Legacy-only. Private proof object keys are deliberately not exposed in
    # donor-facing contribution responses.
    proof_image_url: Optional[str] = None
    status: ContributionStatus
    contribution_month: str
    admin_note: Optional[str] = None
    confirmed_by: Optional[UUID] = None
    confirmed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminNoteRequest(BaseModel):
    admin_note: Optional[str] = None


class ContributionAdminOut(ContributionOut):
    user_full_name: Optional[str] = None
    user_phone: Optional[str] = None
    user_email: Optional[str] = None
    proof_available: bool = False
    proof_expires_at: Optional[datetime] = None
