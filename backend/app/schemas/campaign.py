from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.enums import CampaignStatus, CampaignType

_TYPE_MAP = {
    CampaignType.friday: "friday_challenge",
}


class CampaignCreate(BaseModel):
    title: str
    campaign_type: Optional[CampaignType] = None
    type: Optional[str] = None  # alias accepted from admin frontend
    description: str
    target_amount: Optional[float] = None
    donor_target: Optional[int] = None
    target_donors: Optional[int] = None  # alias accepted from admin frontend
    starts_at: Optional[datetime] = None
    start_date: Optional[str] = None  # alias accepted from admin frontend
    ends_at: Optional[datetime] = None
    end_date: Optional[str] = None  # alias accepted from admin frontend
    cover_image_url: Optional[str] = None
    image_url: Optional[str] = None  # alias accepted from admin frontend
    video_url: Optional[str] = None
    status: CampaignStatus = CampaignStatus.draft

    @model_validator(mode='after')
    def resolve_aliases(self) -> 'CampaignCreate':
        if self.campaign_type is None and self.type is not None:
            type_map = {v: k for k, v in _TYPE_MAP.items()}
            try:
                self.campaign_type = type_map.get(self.type) or CampaignType(self.type)
            except ValueError:
                self.campaign_type = CampaignType.general
        if self.campaign_type is None:
            self.campaign_type = CampaignType.general
        if self.donor_target is None and self.target_donors is not None:
            self.donor_target = self.target_donors
        if self.cover_image_url is None and self.image_url is not None:
            self.cover_image_url = self.image_url
        return self


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

    # Frontend-compatible alias fields (mobile + admin)
    type: Optional[str] = None
    is_active: Optional[bool] = None
    is_urgent: bool = False
    target_donors: Optional[int] = None
    current_donors: Optional[int] = None
    image_url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def compute_alias_fields(self) -> 'CampaignOut':
        self.type = _TYPE_MAP.get(self.campaign_type, self.campaign_type.value)
        self.is_active = self.status == CampaignStatus.active
        self.is_urgent = self.campaign_type == CampaignType.emergency
        self.target_donors = self.donor_target
        self.current_donors = self.donor_count
        self.image_url = self.cover_image_url
        self.start_date = self.starts_at.isoformat() if self.starts_at else None
        self.end_date = self.ends_at.isoformat() if self.ends_at else None
        return self
