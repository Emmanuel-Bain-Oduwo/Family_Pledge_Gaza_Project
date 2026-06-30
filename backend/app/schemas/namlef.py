from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import NamlefContentStatus, NamlefContentType


class NamlefContentCreate(BaseModel):
    title: str
    speaker_name: Optional[str] = None
    speaker_role: Optional[str] = None
    content_type: NamlefContentType
    description: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_featured: bool = False
    status: NamlefContentStatus = NamlefContentStatus.draft


class NamlefContentUpdate(BaseModel):
    title: Optional[str] = None
    speaker_name: Optional[str] = None
    speaker_role: Optional[str] = None
    content_type: Optional[NamlefContentType] = None
    description: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_featured: Optional[bool] = None
    status: Optional[NamlefContentStatus] = None


class NamlefContentOut(BaseModel):
    id: UUID
    title: str
    speaker_name: Optional[str] = None
    speaker_role: Optional[str] = None
    content_type: NamlefContentType
    description: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_featured: bool
    status: NamlefContentStatus
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
