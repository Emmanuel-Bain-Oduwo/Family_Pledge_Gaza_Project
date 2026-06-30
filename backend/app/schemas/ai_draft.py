from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import AiDraftStatus, AiDraftType


class AiReminderRequest(BaseModel):
    topic: Optional[str] = None
    reminder_type: Optional[str] = "quran"
    tone: Optional[str] = "spiritual and motivational"


class AiImpactUpdateRequest(BaseModel):
    project_title: Optional[str] = None
    beneficiaries_count: Optional[int] = None
    location: Optional[str] = None
    extra_context: Optional[str] = None


class AiWeeklySummaryRequest(BaseModel):
    week_start: Optional[str] = None
    total_contributions: Optional[int] = None
    total_amount: Optional[float] = None
    extra_context: Optional[str] = None


class AiCollectorMessageRequest(BaseModel):
    collector_name: Optional[str] = None
    group_name: Optional[str] = None
    pending_count: Optional[int] = None
    extra_context: Optional[str] = None


class AiDraftOut(BaseModel):
    id: UUID
    admin_id: UUID
    draft_type: AiDraftType
    input_context: Optional[Dict[str, Any]] = None
    generated_text: str
    status: AiDraftStatus
    approved_by: Optional[UUID] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
