from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


ALLOWED_SUPPORT_CATEGORIES = {"general", "account", "pledge", "contribution", "technical", "privacy"}
ALLOWED_SUPPORT_STATUSES = {"open", "in_progress", "resolved"}


class SupportMessageCreate(BaseModel):
    subject: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=5000)
    category: str = "general"

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_SUPPORT_CATEGORIES:
            raise ValueError("Unsupported support category")
        return normalized


class SupportMessageAdminUpdate(BaseModel):
    status: Optional[str] = None
    admin_response: Optional[str] = Field(default=None, max_length=5000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in ALLOWED_SUPPORT_STATUSES:
            raise ValueError("Unsupported support status")
        return normalized


class SupportMessageOut(BaseModel):
    id: UUID
    user_id: UUID
    subject: str
    message: str
    category: str
    status: str
    admin_response: Optional[str] = None
    responded_by: Optional[UUID] = None
    responded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_display_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
