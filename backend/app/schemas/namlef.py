from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator

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

    # Frontend-compatible alias fields
    featured: Optional[bool] = None
    author: Optional[str] = None
    author_title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    date: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def compute_alias_fields(self) -> 'NamlefContentOut':
        self.featured = self.is_featured
        self.author = self.speaker_name
        self.author_title = self.speaker_role
        self.content = self.description
        self.image_url = self.thumbnail_url
        self.video_url = self.url if self.content_type == NamlefContentType.video else None
        self.audio_url = self.url if self.content_type == NamlefContentType.audio else None
        self.date = self.created_at.isoformat()
        return self
