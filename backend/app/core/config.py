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
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/familypledge"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"
    SQL_ECHO: bool = False
    EXPO_ACCESS_TOKEN: str = ""
    EMAIL_PROVIDER: str = "smtp"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    WEEKLY_EMAILS_ENABLED: bool = False
    # Cloudinary — for signed upload (optional)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

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
