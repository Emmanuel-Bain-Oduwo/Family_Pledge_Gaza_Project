from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.APP_ENV.lower() == "production":
            if not self.DATABASE_URL or "localhost" in self.DATABASE_URL:
                raise ValueError(
                    "DATABASE_URL must be explicitly configured for production"
                )
            if not self.JWT_SECRET or self.JWT_SECRET == "change-me-in-production":
                raise ValueError("JWT_SECRET must be changed for production")
            if not self.CORS_ORIGINS or "localhost" in self.CORS_ORIGINS:
                raise ValueError(
                    "CORS_ORIGINS must list deployed frontend origins in production"
                )
        return self

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
