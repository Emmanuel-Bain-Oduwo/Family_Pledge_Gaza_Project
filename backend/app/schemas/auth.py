from typing import Optional

from pydantic import BaseModel, field_validator


class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str
    country: Optional[str] = None
    city: Optional[str] = None
    nickname: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PushTokenRequest(BaseModel):
    push_token: str
