from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

GoalType = Literal[
    "monthly_pledge",
    "friday_contribution",
    "humanitarian_action",
    "share_campaign",
    "read_impact",
    "invite_family",
    "support_campaign",
]


class GoalCreate(BaseModel):
    goal_type: GoalType
    title: str = Field(min_length=2, max_length=255)
    target_count: int = Field(default=1, ge=1, le=365)
    cadence: Literal["once", "weekly", "monthly"] = "once"
    starts_on: date | None = None
    ends_on: date | None = None


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    target_count: int | None = Field(default=None, ge=1, le=365)
    status: Literal["active", "completed", "archived"] | None = None
    ends_on: date | None = None


class GoalOut(BaseModel):
    id: UUID
    goal_type: str
    title: str
    target_count: int
    current_count: int
    cadence: str
    status: str
    starts_on: date
    ends_on: date | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EngagementEventCreate(BaseModel):
    event_type: Literal[
        "impact_viewed",
        "campaign_shared",
        "humanitarian_action_completed",
        "tutorial_viewed",
    ]
    entity_type: str | None = Field(default=None, max_length=50)
    entity_id: UUID | None = None


class ImpactJourneyOut(BaseModel):
    current_consistency_months: int
    longest_consistency_months: int
    confirmed_contributions: int
    pledge_since: date | None = None
    campaigns_supported: int
    impact_updates_viewed: int
    campaigns_shared: int
    circles_joined: int


class AchievementOut(BaseModel):
    key: str
    name: str
    description: str
    icon: str
    earned: bool
    progress: int
    target: int


class CircleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class CircleJoin(BaseModel):
    code: str = Field(min_length=4, max_length=20)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class CircleMemberOut(BaseModel):
    user_id: UUID
    display_name: str
    role: str
    joined_at: datetime


class CircleStatsOut(BaseModel):
    member_count: int
    active_members: int
    participation_rate: float
    confirmed_actions_this_month: int
    consistency_score: float


class CircleOut(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    invite_code: str
    owner_user_id: UUID
    is_owner: bool
    share_url: str
    stats: CircleStatsOut


class CircleDetailOut(CircleOut):
    members: list[CircleMemberOut]


class FeatureRequestCreate(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=3000)


class FeatureRequestStatusUpdate(BaseModel):
    status: Literal["new", "reviewing", "planned", "completed", "declined"]


class FeatureRequestOut(BaseModel):
    id: UUID
    title: str
    description: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
