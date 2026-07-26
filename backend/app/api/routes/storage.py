"""Cloudflare R2 direct-upload and media usage APIs — admin only.

Large file bytes travel directly from the browser to R2. The API only signs a
short-lived PUT and stores object URLs/keys and metadata in PostgreSQL.
"""
from __future__ import annotations

import re
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import quote

import boto3
from botocore.config import Config
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.media_asset import MediaAsset
from app.models.user import User

router = APIRouter(prefix="/admin/storage", tags=["Storage"])

FolderKey = Literal[
    "projects", "impact", "namlef", "reminders", "contribution_proofs",
    "documents", "general",
]
ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
    "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg",
    "audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain", "text/csv",
}
SAFE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp4", ".webm",
    ".mov", ".avi", ".mpeg", ".mpg", ".mp3", ".m4a", ".wav", ".ogg",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv",
}
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".html", ".htm", ".py",
    ".jar", ".msi", ".apk", ".ipa",
}


class PresignedUploadRequest(BaseModel):
    folder: FolderKey
    filename: str = Field(min_length=1, max_length=512)
    content_type: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0)


class PresignedUploadOut(BaseModel):
    upload_url: str
    method: Literal["PUT"] = "PUT"
    required_headers: dict[str, str]
    public_url: str
    object_key: str
    bucket: str
    size_bytes: int
    content_type: str


class ConfirmUploadRequest(BaseModel):
    object_key: str = Field(min_length=1, max_length=1024)
    public_url: str = Field(min_length=1, max_length=2048)
    original_filename: str = Field(min_length=1, max_length=512)
    content_type: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0)
    folder: FolderKey
    related_entity_type: str | None = Field(default=None, max_length=80)
    related_entity_id: uuid.UUID | None = None


class MediaAssetOut(BaseModel):
    id: uuid.UUID
    object_key: str
    public_url: str | None
    original_filename: str | None
    content_type: str | None
    file_extension: str | None
    folder: str
    size_bytes: int
    uploaded_by: uuid.UUID | None
    upload_source: str
    related_entity_type: str | None
    related_entity_id: uuid.UUID | None
    is_public: bool
    status: str
    created_at: datetime
    uploaded_at: datetime | None

    model_config = {"from_attributes": True}


def _require_r2_config() -> None:
    if not all((settings.R2_ACCOUNT_ID, settings.R2_ACCESS_KEY_ID,
                settings.R2_SECRET_ACCESS_KEY, settings.R2_BUCKET_NAME,
                settings.R2_PUBLIC_BASE_URL)):
        raise HTTPException(503, "Media storage is not configured. Please contact admin.")


def _extension(filename: str) -> str:
    return Path(filename.strip()).suffix.lower()


def validate_upload(filename: str, content_type: str, size_bytes: int) -> str:
    extension = _extension(filename)
    if extension in DANGEROUS_EXTENSIONS or extension not in SAFE_EXTENSIONS:
        raise HTTPException(400, "This file type is not allowed for security reasons.")
    normalized_type = content_type.lower().split(";", 1)[0].strip()
    if normalized_type not in ALLOWED_CONTENT_TYPES and not (
        normalized_type == "application/octet-stream" and extension in SAFE_EXTENSIONS
    ):
        raise HTTPException(400, "This file type is not allowed for security reasons.")
    max_bytes = settings.R2_MAX_UPLOAD_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise HTTPException(413, "File is larger than the current configured upload limit.")
    return normalized_type


def safe_filename(filename: str) -> str:
    extension = _extension(filename)
    stem = Path(filename.strip()).stem
    stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    stem = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-._").lower()
    return f"{stem[:120] or 'file'}{extension}"


def make_object_key(folder: str, filename: str, now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    return f"family-pledge/{folder}/{now:%Y}/{now:%m}/{uuid.uuid4()}-{safe_filename(filename)}"


def public_url_for(object_key: str) -> str:
    return f"{settings.R2_PUBLIC_BASE_URL.rstrip('/')}/{quote(object_key, safe='/')}"


def _r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


@router.post("/r2-presigned-upload", response_model=PresignedUploadOut)
def create_presigned_upload(
    body: PresignedUploadRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_r2_config()
    content_type = validate_upload(body.filename, body.content_type, body.size_bytes)
    object_key = make_object_key(body.folder, body.filename)
    public_url = public_url_for(object_key)
    try:
        upload_url = _r2_client().generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": object_key, "ContentType": content_type},
            ExpiresIn=900,
            HttpMethod="PUT",
        )
    except Exception as exc:
        raise HTTPException(503, "Media storage is not configured. Please contact admin.") from exc

    db.add(MediaAsset(
        object_key=object_key, public_url=public_url,
        original_filename=body.filename, content_type=content_type,
        file_extension=_extension(body.filename), folder=body.folder,
        size_bytes=body.size_bytes, uploaded_by=admin.id,
        is_public=body.folder != "contribution_proofs",
    ))
    db.commit()
    return PresignedUploadOut(
        upload_url=upload_url, required_headers={"Content-Type": content_type},
        public_url=public_url, object_key=object_key, bucket=settings.R2_BUCKET_NAME,
        size_bytes=body.size_bytes, content_type=content_type,
    )


@router.post("/r2-confirm-upload", response_model=MediaAssetOut)
def confirm_upload(
    body: ConfirmUploadRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_r2_config()
    content_type = validate_upload(body.original_filename, body.content_type, body.size_bytes)
    prefix = f"family-pledge/{body.folder}/"
    if not body.object_key.startswith(prefix):
        raise HTTPException(400, "Invalid storage object key.")
    expected_url = public_url_for(body.object_key)
    if body.public_url.rstrip("/") != expected_url.rstrip("/"):
        raise HTTPException(400, "Invalid public media URL.")

    asset = db.scalar(select(MediaAsset).where(MediaAsset.object_key == body.object_key))
    if asset is None:
        asset = MediaAsset(object_key=body.object_key, uploaded_by=admin.id)
        db.add(asset)
    elif asset.uploaded_by not in (None, admin.id):
        raise HTTPException(403, "This upload belongs to another administrator.")
    asset.public_url = expected_url
    asset.original_filename = body.original_filename
    asset.content_type = content_type
    asset.file_extension = _extension(body.original_filename)
    asset.folder = body.folder
    asset.size_bytes = body.size_bytes
    asset.related_entity_type = body.related_entity_type
    asset.related_entity_id = body.related_entity_id
    asset.is_public = body.folder != "contribution_proofs"
    asset.status = "uploaded"
    asset.uploaded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/usage")
def storage_usage(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    active = (MediaAsset.status == "uploaded", MediaAsset.deleted_at.is_(None))
    total_files, total_bytes = db.execute(
        select(func.count(MediaAsset.id), func.coalesce(func.sum(MediaAsset.size_bytes), 0)).where(*active)
    ).one()
    folder_rows = db.execute(
        select(MediaAsset.folder, func.count(MediaAsset.id), func.coalesce(func.sum(MediaAsset.size_bytes), 0))
        .where(*active).group_by(MediaAsset.folder)
    ).all()
    type_rows = db.execute(
        select(MediaAsset.content_type, func.count(MediaAsset.id), func.coalesce(func.sum(MediaAsset.size_bytes), 0))
        .where(*active).group_by(MediaAsset.content_type)
    ).all()
    latest = db.scalars(
        select(MediaAsset).where(*active).order_by(MediaAsset.uploaded_at.desc()).limit(10)
    ).all()
    total_bytes = int(total_bytes or 0)
    return {
        "total_files": int(total_files), "total_bytes": total_bytes,
        "total_mb": round(total_bytes / 1024**2, 2), "total_gb": round(total_bytes / 1024**3, 3),
        "files_by_folder": {name: int(count) for name, count, _ in folder_rows},
        "bytes_by_folder": {name: int(size) for name, _, size in folder_rows},
        "files_by_content_type": {(name or "unknown"): int(count) for name, count, _ in type_rows},
        "bytes_by_content_type": {(name or "unknown"): int(size) for name, _, size in type_rows},
        "latest_uploads": [MediaAssetOut.model_validate(item).model_dump(mode="json") for item in latest],
    }


@router.post("/cloudinary-signature", deprecated=True, status_code=410)
def deprecated_cloudinary_upload(admin: User = Depends(require_admin)):
    raise HTTPException(410, "Cloudinary uploads are deprecated. Use Cloudflare R2 storage.")
