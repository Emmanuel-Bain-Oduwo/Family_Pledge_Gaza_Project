from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AiDraftStatus, AiDraftType


class AiReminderRequest(BaseModel):
    audience: str = "donors"
    campaign_title: Optional[str] = None
    campaign_goal: Optional[str] = None
    donor_progress: Optional[str] = None
    tone: Literal["warm", "formal", "concise", "motivational"] = "warm"
    language: str = "English"
    key_points: List[str] = Field(default_factory=list)
    max_length: Optional[int] = 200


class AiImpactUpdateRequest(BaseModel):
    project_title: str
    category: Optional[str] = None
    verified_facts: List[str] = Field(default_factory=list)
    beneficiaries_count: Optional[int] = None
    completed_date: Optional[str] = None
    call_to_action: Optional[str] = None
    tone: Literal["warm", "formal", "concise", "motivational"] = "warm"
    language: str = "English"


class AiWeeklySummaryRequest(BaseModel):
    # Backend fetches live stats; admin may optionally narrow by date label
    date_range: Optional[str] = None


class AiCollectorMessageRequest(BaseModel):
    collector_name: Optional[str] = None
    group_name: str
    registered_count: Optional[int] = None
    contributed_count: Optional[int] = None
    pending_count: Optional[int] = None
    campaign_title: Optional[str] = None
    tone: Literal["warm", "formal", "concise", "motivational"] = "warm"
    language: str = "English"


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
