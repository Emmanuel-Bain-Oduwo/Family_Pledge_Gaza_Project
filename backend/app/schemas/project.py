from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import ProjectCategory, ProjectStatus


class ProjectCreate(BaseModel):
    title: str
    category: ProjectCategory
    description: str
    target_amount: Optional[float] = None
    beneficiaries_count: Optional[int] = None
    status: ProjectStatus = ProjectStatus.upcoming
    location: Optional[str] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[ProjectCategory] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    raised_amount: Optional[float] = None
    beneficiaries_count: Optional[int] = None
    status: Optional[ProjectStatus] = None
    location: Optional[str] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None


class ProjectOut(BaseModel):
    id: UUID
    title: str
    category: ProjectCategory
    description: str
    target_amount: Optional[float] = None
    raised_amount: float
    beneficiaries_count: Optional[int] = None
    status: ProjectStatus
    location: Optional[str] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
