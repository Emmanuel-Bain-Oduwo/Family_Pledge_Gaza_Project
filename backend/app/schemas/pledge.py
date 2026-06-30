from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import PledgeStatus, PledgeType


class PledgeCreate(BaseModel):
    pledge_type: PledgeType = PledgeType.monthly
    amount: float = 10.00
    currency: str = "USD"
    start_date: date


class PledgeUpdate(BaseModel):
    status: Optional[PledgeStatus] = None
    amount: Optional[float] = None


class PledgeOut(BaseModel):
    id: UUID
    user_id: UUID
    amount: float
    currency: str
    pledge_type: PledgeType
    status: PledgeStatus
    start_date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PledgeStatusOut(BaseModel):
    has_active_pledge: bool
    pledge: Optional[PledgeOut] = None
    confirmed_contributions_count: int
    current_month_contributed: bool
