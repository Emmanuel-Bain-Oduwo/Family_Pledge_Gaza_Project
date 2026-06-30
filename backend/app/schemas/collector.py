from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CollectorCreate(BaseModel):
    user_id: UUID
    group_name: Optional[str] = None
    country: Optional[str] = None


class CollectorMemberAdd(BaseModel):
    donor_user_id: UUID


class CollectorOut(BaseModel):
    id: UUID
    user_id: UUID
    collector_code: str
    group_name: Optional[str] = None
    country: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CollectorWithMemberCount(CollectorOut):
    member_count: int = 0


class CollectorMemberOut(BaseModel):
    id: UUID
    collector_id: UUID
    donor_user_id: UUID
    display_name: str
    country: Optional[str] = None
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CollectorDashboardOut(BaseModel):
    collector: CollectorOut
    member_count: int
    confirmed_this_month: int
    pending_this_month: int
    total_confirmed: int


class InviteCodeOut(BaseModel):
    collector_code: str
