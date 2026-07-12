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

    @field_validator("contribution_month")
    @classmethod
    def validate_month(cls, v: str) -> str:
        import re
        if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v):
            raise ValueError("contribution_month must be YYYY-MM format")
        return v


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
