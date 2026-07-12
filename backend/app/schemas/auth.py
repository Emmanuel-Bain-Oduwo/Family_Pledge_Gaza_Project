from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str
    country: Optional[str] = None
    city: Optional[str] = None
    nickname: Optional[str] = None

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
