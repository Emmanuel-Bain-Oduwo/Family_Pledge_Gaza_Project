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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = "gpt-oss-120b"

    AI_VISION_API_KEY: str = ""
    AI_VISION_BASE_URL: str = ""
    AI_VISION_MODEL: str = ""
    AI_VISION_MAX_IMAGE_MB: int = 5

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"
    SQL_ECHO: bool = False
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_TIMEOUT_SECONDS: int = 30
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    EXPO_ACCESS_TOKEN: str = ""

    WEB_APP_BASE_URL: str = "https://familypledgekenya.org"
    PUBLIC_API_BASE_URL: str = "https://api.familypledgekenya.org/api/v1"

    # M-PESA / Safaricom Daraja. Secrets are backend-only. The currently
    # supplied public PayBill account reference is 133133; production shortcode
    # remains deployment-configured because it must match Safaricom authorization.
    MPESA_ENABLED: bool = False
    MPESA_ENV: str = "sandbox"
    MPESA_BASE_URL: str = ""
    MPESA_CONSUMER_KEY: str = ""
    MPESA_CONSUMER_SECRET: str = ""
    MPESA_SHORTCODE: str = ""
    MPESA_PASSKEY: str = ""
    MPESA_CALLBACK_URL: str = ""
    MPESA_ACCOUNT_REFERENCE: str = "133133"
    MPESA_TRANSACTION_TYPE: str = "CustomerPayBillOnline"
    MPESA_TRANSACTION_DESC: str = "Family Pledge"
    MPESA_REQUEST_TIMEOUT_SECONDS: int = 20
    MPESA_PAYMENT_TTL_MINUTES: int = 10
    MPESA_USD_KES_RATE: float = 0.0
    MPESA_RECONCILIATION_ENABLED: bool = False
    MPESA_RECONCILIATION_INTERVAL_SECONDS: int = 60
    MPESA_RECONCILIATION_BATCH_SIZE: int = 50
    MPESA_QUERY_AFTER_SECONDS: int = 30

    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_SERVICE_ACCOUNT_JSON_B64: str = ""

    EMAIL_PROVIDER: str = "smtp"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    SMTP_USE_TLS: bool = True
    WEEKLY_EMAILS_ENABLED: bool = False

    WHATSAPP_ENABLED: bool = False
    WHATSAPP_GRAPH_BASE_URL: str = "https://graph.facebook.com"
    WHATSAPP_GRAPH_API_VERSION: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_TEMPLATE_NAME: str = "family_pledge_reminder"
    WHATSAPP_TEMPLATE_LANGUAGE: str = "en"

    OUTBOUND_WORKER_ENABLED: bool = False
    OUTBOUND_WORKER_INTERVAL_SECONDS: int = 30
    OUTBOUND_WORKER_BATCH_SIZE: int = 250

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_BASE_URL: str = ""
    R2_MAX_UPLOAD_MB: int = 500
    R2_ALLOWED_UPLOADS_MODE: str = "broad"

    PROOF_R2_ACCOUNT_ID: str = ""
    PROOF_R2_ACCESS_KEY_ID: str = ""
    PROOF_R2_SECRET_ACCESS_KEY: str = ""
    PROOF_R2_BUCKET_NAME: str = ""
    PROOF_RETENTION_DAYS: int = 30
    PROOF_SIGNED_GET_TTL_SECONDS: int = 600

    STREAM_API_TOKEN: str = ""
    STREAM_CUSTOMER_CODE: str = ""
    STREAM_MAX_DURATION_SECONDS: int = 21600

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url_value(cls, value: str) -> str:
        return normalize_database_url(value)

    @field_validator("MPESA_ENV")
    @classmethod
    def normalize_mpesa_env(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"sandbox", "production"}:
            raise ValueError("MPESA_ENV must be sandbox or production")
        return normalized

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.APP_ENV.lower() == "production":
            if not self.DATABASE_URL or "localhost" in self.DATABASE_URL:
                raise ValueError("DATABASE_URL must be explicitly configured for production")
            if not self.JWT_SECRET or self.JWT_SECRET == "change-me-in-production" or len(self.JWT_SECRET) < 32:
                raise ValueError("JWT_SECRET must be changed for production and be at least 32 characters")
            if not self.CORS_ORIGINS or "localhost" in self.CORS_ORIGINS or "*" in self.cors_origins_list:
                raise ValueError("CORS_ORIGINS must list deployed frontend origins in production")
            if self.WEEKLY_EMAILS_ENABLED and not all([self.SMTP_HOST, self.SMTP_USER, self.SMTP_PASSWORD, self.EMAIL_FROM]):
                raise ValueError("SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM are required when WEEKLY_EMAILS_ENABLED=true")
            if self.WHATSAPP_ENABLED and not all([
                self.WHATSAPP_GRAPH_API_VERSION,
                self.WHATSAPP_PHONE_NUMBER_ID,
                self.WHATSAPP_ACCESS_TOKEN,
                self.WHATSAPP_TEMPLATE_NAME,
            ]):
                raise ValueError("WhatsApp Graph version, credentials, and approved template are required when WHATSAPP_ENABLED=true")
            if self.MPESA_ENABLED and not all([
                self.MPESA_CONSUMER_KEY,
                self.MPESA_CONSUMER_SECRET,
                self.MPESA_SHORTCODE,
                self.MPESA_PASSKEY,
                self.MPESA_CALLBACK_URL,
                self.MPESA_ACCOUNT_REFERENCE,
            ]):
                raise ValueError("M-PESA credentials, shortcode, passkey, callback URL, and account reference are required when MPESA_ENABLED=true")
            if self.MPESA_ENABLED and self.MPESA_USD_KES_RATE <= 0:
                raise ValueError("MPESA_USD_KES_RATE must be configured when M-PESA is enabled")
        return self

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def mpesa_base_url(self) -> str:
        if self.MPESA_BASE_URL.strip():
            return self.MPESA_BASE_URL.rstrip("/")
        return (
            "https://sandbox.safaricom.co.ke"
            if self.MPESA_ENV == "sandbox"
            else "https://api.safaricom.co.ke"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
