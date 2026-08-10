from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

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
    notification_daily: bool = False
    notification_friday: bool = False
    notification_campaigns: bool = False
    notification_emergency: bool = False
    notification_quran: bool = False
    notification_hadith: bool = False
    notification_dua: bool = False
    notification_motivation: bool = False
    notification_impact: bool = False
    notification_humanitarian: bool = False
    notification_onboarding_seen: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPublicOut(BaseModel):
    id: UUID
    display_name: str
    country: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    public_display_name: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class EmailPreferenceRequest(BaseModel):
    weekly_email_opt_in: bool


class NotificationPreferenceRequest(BaseModel):
    daily: bool
    friday: bool
    campaigns: bool
    emergency: bool
    quran: bool = False
    hadith: bool = False
    dua: bool = False
    motivation: bool = False
    impact: bool = False
    humanitarian: bool = False
    onboarding_seen: bool = True


class AnonymousUpdateRequest(BaseModel):
    anonymous_publicly: bool
    public_display_name: Optional[str] = None


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class DeleteAccountOut(BaseModel):
    deleted: bool = True
    retained_records: list[str] = Field(default_factory=lambda: ["contributions", "pledges"])


class BadgeOut(BaseModel):
    id: UUID
    badge_id: UUID
    name: str
    description: str
    icon_url: Optional[str] = None
    awarded_at: datetime
    model_config = ConfigDict(from_attributes=True)
