from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


DonorSegment = Literal[
    "all_donors",
    "active_pledges",
    "missing_this_month",
    "pending_review",
    "confirmed_this_month",
    "inactive_30_days",
    "new_this_month",
    "collectors",
]
CommunicationChannel = Literal["app", "email", "whatsapp"]


class DonorOperationsRow(BaseModel):
    id: UUID
    donor_number: int
    full_name: str | None = None
    nickname: str | None = None
    country: str | None = None
    city: str | None = None
    joined_at: datetime
    pledge_status: str
    contribution_status_this_month: str
    last_contribution_at: datetime | None = None
    months_consistent: int = 0
    priority: str = "normal"
    followup_status: str = "none"
    next_followup_at: datetime | None = None
    last_contacted_at: datetime | None = None
    assigned_admin_id: UUID | None = None
    tags: list[str] = Field(default_factory=list)
    email_available: bool = False
    phone_available: bool = False
    email_reminders_opt_in: bool = False
    whatsapp_reminders_opt_in: bool = False


class DonorOperationsPage(BaseModel):
    items: list[DonorOperationsRow]
    total: int
    page: int
    size: int
    pages: int


class DonorAdminProfileUpdate(BaseModel):
    assigned_admin_id: UUID | None = None
    priority: Literal["low", "normal", "high", "urgent"] | None = None
    followup_status: Literal["none", "watching", "due", "contacted", "snoozed", "resolved"] | None = None
    tags: list[str] | None = None
    internal_notes: str | None = Field(default=None, max_length=5000)
    next_followup_at: datetime | None = None
    last_contacted_at: datetime | None = None

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, value: list[str] | None):
        if value is None:
            return value
        cleaned: list[str] = []
        for item in value[:20]:
            tag = " ".join(item.strip().split())[:40]
            if tag and tag.lower() not in {existing.lower() for existing in cleaned}:
                cleaned.append(tag)
        return cleaned


class DonorDetailOut(BaseModel):
    donor: DonorOperationsRow
    email: str | None = None
    phone: str | None = None
    internal_notes: str | None = None
    active_pledge: dict | None = None
    recent_contributions: list[dict] = Field(default_factory=list)
    open_followups: list[dict] = Field(default_factory=list)


class CommandCenterOut(BaseModel):
    total_donors: int
    active_pledges: int
    missing_this_month: int
    pending_review: int
    needs_follow_up: int
    confirmed_this_month: int
    inactive_30_days: int
    new_this_month: int
    open_followup_cases: int
    scheduled_messages: int
    ai_outputs_waiting: int
    active_campaigns: int
    feature_requests_new: int
    due_followups_today: int
    segment_counts: dict[str, int]


class FollowupStateUpdate(BaseModel):
    action: Literal["assign", "snooze", "resolve", "dismiss", "mark_contacted"]
    assigned_admin_id: UUID | None = None
    snoozed_until: datetime | None = None
    channel: Literal["app", "email", "whatsapp", "phone", "other"] | None = None


class OutboundCampaignCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    body: str = Field(min_length=2, max_length=5000)
    segment: DonorSegment
    channels: list[CommunicationChannel] = Field(min_length=1, max_length=3)
    content_category: str | None = Field(default="pledge", max_length=40)
    scheduled_for: datetime | None = None

    @field_validator("channels")
    @classmethod
    def unique_channels(cls, value: list[str]):
        return list(dict.fromkeys(value))


class OutboundCampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_by_admin_id: UUID
    title: str
    body: str
    segment: str
    content_category: str | None = None
    channels: list[str]
    status: str
    scheduled_for: datetime | None = None
    recipient_count: int
    sent_count: int
    failed_count: int
    created_at: datetime
    updated_at: datetime


class CommunicationPreviewOut(BaseModel):
    segment: str
    total_users: int
    app_eligible: int
    email_eligible: int
    whatsapp_eligible: int
