from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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

    model_config = ConfigDict(from_attributes=True)
