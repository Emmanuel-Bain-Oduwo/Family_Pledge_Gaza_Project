from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str
    country: Optional[str] = None
    city: Optional[str] = None
    nickname: Optional[str] = None
    referral_code: Optional[str] = None
    email_reminders_opt_in: bool = False
    whatsapp_reminders_opt_in: bool = False

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        return v

    @field_validator("phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Phone is required")
        return v


class LoginRequest(BaseModel):
    identifier: str  # phone or email
    password: str

    @field_validator("identifier")
    @classmethod
    def identifier_not_empty(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Phone or email is required")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PushTokenRequest(BaseModel):
    """Legacy Expo-only registration request retained for old app builds."""

    push_token: str

    @field_validator("push_token")
    @classmethod
    def expo_token_shape(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("ExponentPushToken[") or v.startswith("ExpoPushToken[")):
            raise ValueError("Invalid Expo push token")
        if len(v) > 512:
            raise ValueError("Push token is too long")
        return v


class NotificationEndpointRequest(BaseModel):
    provider: Literal["expo", "fcm_web"]
    platform: Literal["android", "ios", "web", "native"]
    token: str = Field(min_length=8, max_length=2048)
    device_id: str | None = Field(default=None, max_length=255)

    @field_validator("token")
    @classmethod
    def validate_provider_token(cls, v: str, info) -> str:
        token = v.strip()
        provider = info.data.get("provider")
        if provider == "expo" and not (
            token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")
        ):
            raise ValueError("Invalid Expo push token")
        return token

    @field_validator("platform")
    @classmethod
    def provider_matches_platform(cls, v: str, info) -> str:
        provider = info.data.get("provider")
        if provider == "fcm_web" and v != "web":
            raise ValueError("FCM Web endpoints must use platform 'web'")
        if provider == "expo" and v == "web":
            raise ValueError("Expo push endpoints are Android/iOS only")
        return v


class NotificationEndpointDeactivateRequest(BaseModel):
    provider: Literal["expo", "fcm_web"]
    token: str = Field(min_length=8, max_length=2048)


class PasswordResetRequest(BaseModel):
    identifier: str  # phone or email

    @field_validator("identifier")
    @classmethod
    def identifier_not_empty(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Phone or email is required")
        return v


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        return v
