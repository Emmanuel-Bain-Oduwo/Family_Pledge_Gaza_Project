from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import CampaignStatus, CampaignType


class CampaignCreate(BaseModel):
    title: str
    campaign_type: CampaignType
    description: str
    target_amount: Optional[float] = None
    donor_target: Optional[int] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None
    status: CampaignStatus = CampaignStatus.draft


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    donor_target: Optional[int] = None
    status: Optional[CampaignStatus] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None


class CampaignOut(BaseModel):
    id: UUID
    title: str
    campaign_type: CampaignType
    description: str
    target_amount: Optional[float] = None
    raised_amount: float
    donor_target: Optional[int] = None
    donor_count: int
    status: CampaignStatus
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
