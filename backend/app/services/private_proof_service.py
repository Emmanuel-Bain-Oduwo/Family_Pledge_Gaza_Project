from __future__ import annotations

from datetime import datetime, timedelta, timezone

import boto3
from botocore.config import Config
from fastapi import HTTPException

from app.core.config import settings

PRIVATE_CACHE_CONTROL = "private, no-store, max-age=0"


def require_private_proof_config() -> None:
    if not all(
        (
            settings.PROOF_R2_ACCOUNT_ID,
            settings.PROOF_R2_ACCESS_KEY_ID,
            settings.PROOF_R2_SECRET_ACCESS_KEY,
            settings.PROOF_R2_BUCKET_NAME,
        )
    ):
        raise HTTPException(
            status_code=503,
            detail="Private contribution-proof storage is not configured.",
        )


def private_r2_client():
    require_private_proof_config()
    return boto3.client(
        "s3",
        endpoint_url=(
            f"https://{settings.PROOF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        ),
        aws_access_key_id=settings.PROOF_R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.PROOF_R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def create_upload_url(object_key: str, content_type: str) -> str:
    try:
        return private_r2_client().generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.PROOF_R2_BUCKET_NAME,
                "Key": object_key,
                "ContentType": content_type,
                "CacheControl": PRIVATE_CACHE_CONTROL,
            },
            ExpiresIn=900,
            HttpMethod="PUT",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Private contribution-proof storage is temporarily unavailable.",
        ) from exc


def verify_uploaded_object(object_key: str) -> dict:
    try:
        return private_r2_client().head_object(
            Bucket=settings.PROOF_R2_BUCKET_NAME,
            Key=object_key,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded contribution proof could not be verified.",
        ) from exc


def create_view_url(object_key: str) -> str:
    try:
        return private_r2_client().generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.PROOF_R2_BUCKET_NAME,
                "Key": object_key,
                "ResponseContentDisposition": "inline",
            },
            ExpiresIn=settings.PROOF_SIGNED_GET_TTL_SECONDS,
            HttpMethod="GET",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="The contribution proof cannot be opened right now.",
        ) from exc


def delete_object(object_key: str) -> None:
    try:
        private_r2_client().delete_object(
            Bucket=settings.PROOF_R2_BUCKET_NAME,
            Key=object_key,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise RuntimeError(f"Failed to delete private proof object {object_key}") from exc


def retention_expires_at(now: datetime | None = None) -> datetime:
    current = now or datetime.now(timezone.utc)
    return current + timedelta(days=settings.PROOF_RETENTION_DAYS)
