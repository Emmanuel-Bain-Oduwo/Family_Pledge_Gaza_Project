from typing import Any, Dict, List

from pydantic import BaseModel


class DashboardOut(BaseModel):
    total_donors: int
    active_pledges: int
    contributions_this_month: int
    pending_contributions: int
    active_campaigns: int
    total_campaign_raised: float
    collectors_count: int
    latest_activity: List[Dict[str, Any]]
