from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


class ImpactCardCreate(BaseModel):
    project_id: Optional[UUID] = None
    title: str
    story: str
    beneficiaries_count: Optional[int] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    completed_at: Optional[datetime] = None


class ImpactCardUpdate(BaseModel):
    project_id: Optional[UUID] = None
    title: Optional[str] = None
    story: Optional[str] = None
    beneficiaries_count: Optional[int] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    completed_at: Optional[datetime] = None


class ImpactCardOut(BaseModel):
    id: UUID
    project_id: Optional[UUID] = None
    title: str
    story: str
    beneficiaries_count: Optional[int] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    # Frontend-compatible alias fields (mobile)
    description: Optional[str] = None
    category: str = 'general'
    beneficiaries: Optional[int] = None
    location: Optional[str] = None
    date: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def compute_alias_fields(self) -> 'ImpactCardOut':
        self.description = self.story
        self.category = 'general'
        self.beneficiaries = self.beneficiaries_count
        self.location = None
        self.date = self.created_at.isoformat()
        return self
