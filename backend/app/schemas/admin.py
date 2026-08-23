from typing import Any, Dict, List

from pydantic import BaseModel, EmailStr, Field


class DashboardOut(BaseModel):
    total_donors: int
    active_pledges: int
    contributions_this_month: int
    pending_contributions: int
    paid_donors_this_month: int = 0
    successful_payments_this_month: int = 0
    pending_payments: int = 0
    failed_payments: int = 0
    mpesa_settled_kes: float = 0.0
    active_campaigns: int
    total_campaign_raised: float
    total_raised_tracked: float | None = None
    collectors_count: int
    top_contributors: List[Dict[str, Any]] = []
    latest_activity: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]] | None = None


class AdminDonorOut(BaseModel):
    id: str
    full_name: str | None = None
    nickname: str | None = None
    phone: str | None = None
    email: str | None = None
    country: str | None = None
    city: str | None = None
    anonymous_publicly: bool
    is_collector: bool
    collector_code: str | None = None
    pledge_status: str
    donor_number: int | None = None
    created_at: str

class TrackedContactInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=30)
    email: EmailStr | None = None
    country: str | None = Field(None, max_length=100)
    status: str = Field("following_up", pattern="^(following_up|pledged|paid|paused)$")
    notes: str | None = Field(None, max_length=2000)
    referral_code: str | None = Field(None, min_length=4, max_length=50, pattern="^[A-Za-z0-9_-]+$")

class TrackedContactOut(TrackedContactInput):
    id: str
    is_active: bool
    created_at: str
    linked_user_id: str | None = None
