from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Railway/Heroku may expose postgres://, while SQLAlchemy expects postgresql://."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Settings(BaseSettings):
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    SENTRY_DSN: str | None = None
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/familypledge"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = "gpt-oss-120b"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"
    SQL_ECHO: bool = False
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_TIMEOUT_SECONDS: int = 30
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    EXPO_ACCESS_TOKEN: str = ""
    EMAIL_PROVIDER: str = "smtp"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    WEEKLY_EMAILS_ENABLED: bool = False

    # Cloudflare R2 — public application media (backend secrets only)
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_BASE_URL: str = ""
    R2_MAX_UPLOAD_MB: int = 500
    R2_ALLOWED_UPLOADS_MODE: str = "broad"

    # Cloudflare R2 — private payment/contribution proofs.
    # Keep these credentials scoped to the private proof bucket and never expose
    # this bucket through a public custom domain or r2.dev URL.
    PROOF_R2_ACCOUNT_ID: str = ""
    PROOF_R2_ACCESS_KEY_ID: str = ""
    PROOF_R2_SECRET_ACCESS_KEY: str = ""
    PROOF_R2_BUCKET_NAME: str = ""
    PROOF_RETENTION_DAYS: int = 30
    PROOF_SIGNED_GET_TTL_SECONDS: int = 600

    # Cloudflare Stream — adaptive video delivery (backend token only)
    STREAM_API_TOKEN: str = ""
    STREAM_CUSTOMER_CODE: str = ""
    STREAM_MAX_DURATION_SECONDS: int = 21600

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url_value(cls, value: str) -> str:
        return normalize_database_url(value)

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.APP_ENV.lower() == "production":
            if not self.DATABASE_URL or "localhost" in self.DATABASE_URL:
                raise ValueError(
                    "DATABASE_URL must be explicitly configured for production"
                )
            if (
                not self.JWT_SECRET
                or self.JWT_SECRET == "change-me-in-production"
                or len(self.JWT_SECRET) < 32
            ):
                raise ValueError(
                    "JWT_SECRET must be changed for production and be at least 32 characters"
                )
            if (
                not self.CORS_ORIGINS
                or "localhost" in self.CORS_ORIGINS
                or "*" in self.cors_origins_list
            ):
                raise ValueError(
                    "CORS_ORIGINS must list deployed frontend origins in production"
                )
            if self.WEEKLY_EMAILS_ENABLED and not all(
                [self.SMTP_HOST, self.SMTP_USER, self.SMTP_PASSWORD, self.EMAIL_FROM]
            ):
                raise ValueError(
                    "SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM are required when WEEKLY_EMAILS_ENABLED=true"
                )
        return self

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
