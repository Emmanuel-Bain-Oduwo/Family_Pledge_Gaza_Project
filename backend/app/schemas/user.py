from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole


class UserOut(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    role: UserRole
    anonymous_publicly: bool
    public_display_name: Optional[str] = None
    is_active: bool
    weekly_email_opt_in: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPublicOut(BaseModel):
    """Public donor view — hides email/phone, respects anonymous_publicly flag."""
    id: UUID
    display_name: str
    country: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    public_display_name: Optional[str] = None


class EmailPreferenceRequest(BaseModel):
    weekly_email_opt_in: bool


class AnonymousUpdateRequest(BaseModel):
    anonymous_publicly: bool
    public_display_name: Optional[str] = None


class BadgeOut(BaseModel):
    id: UUID
    badge_id: UUID
    name: str
    description: str
    icon_url: Optional[str] = None
    awarded_at: datetime

    model_config = ConfigDict(from_attributes=True)
