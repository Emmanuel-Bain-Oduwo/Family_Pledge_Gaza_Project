from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AiContentStatus, AiFollowupStatus, AiPriority, AiTaskRunStatus, AiTaskStatus, AiTaskType


class AiContentDraftCreate(BaseModel):
    prompt: str = Field(..., min_length=3)
    content_type: str = "reminder"
    channel: str = "push"


class AiGeneratedContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    task_id: UUID | None = None
    created_by_admin_id: UUID
    content_type: str
    channel: str
    title: str
    body: str
    status: AiContentStatus
    approved_by: UUID | None = None
    approved_at: datetime | None = None
    scheduled_for: datetime | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AiFollowupSuggestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID | None = None
    type: str
    user_id: UUID | None = None
    donor_name: str | None = None
    reason: str
    recommended_action: str
    suggested_message: str
    priority: AiPriority
    related_contribution_id: UUID | None = None
    related_pledge_id: UUID | None = None
    status: AiFollowupStatus | None = None


class AiTaskCreate(BaseModel):
    title: str
    task_type: AiTaskType
    instruction: str
    schedule_type: str | None = None
    cron_expression: str | None = None
    timezone: str = "Africa/Nairobi"
    next_run_at: datetime | None = None
    requires_approval: bool = True
    status: AiTaskStatus = AiTaskStatus.draft


class AiTaskUpdate(BaseModel):
    title: str | None = None
    instruction: str | None = None
    schedule_type: str | None = None
    cron_expression: str | None = None
    timezone: str | None = None
    next_run_at: datetime | None = None
    requires_approval: bool | None = None
    status: AiTaskStatus | None = None


class AiTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_by_admin_id: UUID
    title: str
    task_type: AiTaskType
    instruction: str
    schedule_type: str | None = None
    cron_expression: str | None = None
    timezone: str
    requires_approval: bool
    status: AiTaskStatus
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AiTaskRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    task_id: UUID
    status: AiTaskRunStatus
    planned_action: dict[str, Any] | None = None
    generated_output: dict[str, Any] | None = None
    validation_result: dict[str, Any] | None = None
    error_message: str | None = None
    executed_at: datetime | None = None
    created_at: datetime


class AiSummaryOut(BaseModel):
    pending_content: int
    pending_followups: int
    active_tasks: int
    failed_task_runs: int
    safety_mode: str = "suggest_only_admin_approval_required"
