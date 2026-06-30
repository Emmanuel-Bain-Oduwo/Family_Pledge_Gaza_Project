"""
Media storage helpers — admin only.

Policy:
- Images and short videos (≤30s, ≤1MB): upload to Cloudinary.
- Long Sheikh/NAMLEF videos: YouTube (unlisted). Do not upload large videos here.
- PostgreSQL stores only URLs and metadata, never raw files.
- No beneficiary-sensitive images should be public without admin approval.
"""
import hashlib
import time
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import require_admin
from app.models.user import User

router = APIRouter(prefix="/admin/storage", tags=["Storage"])

UPLOAD_FOLDERS = {
    "projects": "family-pledge/projects",
    "impact": "family-pledge/impact",
    "namlef": "family-pledge/namlef",
    "reminders": "family-pledge/reminders",
    "contribution_proofs": "family-pledge/contribution-proofs",
}

FolderKey = Literal["projects", "impact", "namlef", "reminders", "contribution_proofs"]


class CloudinarySignatureRequest(BaseModel):
    folder: FolderKey = "projects"


class CloudinarySignatureOut(BaseModel):
    timestamp: int
    signature: str
    cloud_name: str
    api_key: str
    upload_folder: str
    # Tells the client which Cloudinary endpoint to POST to
    upload_url: str


def _generate_signature(folder: str, timestamp: int, api_secret: str) -> str:
    """
    Cloudinary v1 signature: SHA1(sorted_params_string + api_secret).
    Parameters sent to Cloudinary must exactly match those used here.
    """
    params_string = f"folder={folder}&timestamp={timestamp}"
    return hashlib.sha1((params_string + api_secret).encode()).hexdigest()


@router.post("/cloudinary-signature", response_model=CloudinarySignatureOut)
def get_cloudinary_signature(
    body: CloudinarySignatureRequest,
    admin: User = Depends(require_admin),
):
    """
    Return a short-lived signed upload token for Cloudinary.
    The admin dashboard uses this to upload directly from the browser to Cloudinary
    without ever sending files through this server, keeping Railway bandwidth costs zero.

    The signature is valid for ~1 hour (Cloudinary rejects timestamps older than 1h).
    """
    if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY or not settings.CLOUDINARY_API_SECRET:
        raise HTTPException(
            503,
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.",
        )

    folder = UPLOAD_FOLDERS[body.folder]
    timestamp = int(time.time())
    signature = _generate_signature(folder, timestamp, settings.CLOUDINARY_API_SECRET)

    return CloudinarySignatureOut(
        timestamp=timestamp,
        signature=signature,
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        upload_folder=folder,
        upload_url=f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/auto/upload",
    )
