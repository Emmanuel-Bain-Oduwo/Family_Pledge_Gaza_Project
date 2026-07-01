from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.campaign import Campaign
from app.models.contribution import Contribution
from app.models.enums import (
    CampaignStatus,
    CampaignType,
    ContributionStatus,
    PledgeStatus,
    ReminderStatus,
    UserRole,
)
from app.models.impact import ImpactCard
from app.models.pledge import Pledge
from app.models.reminder import DailyReminder
from app.models.user import User
from app.schemas.campaign import CampaignOut
from app.schemas.impact_card import ImpactCardOut
from app.schemas.pledge import PledgeOut, PledgeStatusOut
from app.schemas.reminder import ReminderOut
from app.schemas.user import UserOut
from app.utils.validators import current_month

router = APIRouter(tags=["Mobile"])


class MonthlyProgress(BaseModel):
    target: int
    current: int


class MobileDashboardOut(BaseModel):
    user: Dict[str, Any]
    pledge_status: str
    donor_number: int
    total_donors_today: int
    active_campaign: Optional[CampaignOut] = None
    emergency_appeal: Optional[CampaignOut] = None
    latest_reminder: Optional[ReminderOut] = None
    latest_impact: Optional[ImpactCardOut] = None
    monthly_progress: MonthlyProgress
    pledge_summary: Optional[PledgeStatusOut] = None


@router.get("/dashboard", response_model=MobileDashboardOut)
def mobile_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Pledge status
    active_pledge = db.scalar(
        select(Pledge).where(
            Pledge.user_id == current_user.id,
            Pledge.status == PledgeStatus.active,
        )
    )

    month = current_month()
    confirmed_count = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.user_id == current_user.id,
            Contribution.status == ContributionStatus.confirmed,
        )
    ) or 0

    this_month_contrib = db.scalar(
        select(Contribution).where(
            Contribution.user_id == current_user.id,
            Contribution.contribution_month == month,
            Contribution.status.in_(
                [ContributionStatus.submitted, ContributionStatus.confirmed]
            ),
        )
    )

    has_active_pledge = active_pledge is not None
    current_month_contributed = this_month_contrib is not None

    if has_active_pledge and current_month_contributed:
        pledge_status_str = "paid"
    elif has_active_pledge and not current_month_contributed:
        pledge_status_str = "pending"
    elif not has_active_pledge:
        pledge_status_str = "none"
    else:
        pledge_status_str = "none"

    # Donor number (row rank by created_at)
    donor_number = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor,
            User.created_at <= current_user.created_at,
            User.deleted_at.is_(None),
        )
    ) or 1

    # Total donors registered today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total_donors_today = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor,
            User.created_at >= today_start,
            User.deleted_at.is_(None),
        )
    ) or 0

    # Active non-emergency campaign
    active_campaign_db = db.scalar(
        select(Campaign).where(
            Campaign.status == CampaignStatus.active,
            Campaign.campaign_type != CampaignType.emergency,
            Campaign.deleted_at.is_(None),
        ).order_by(Campaign.created_at.desc())
    )

    # Emergency campaign
    emergency_db = db.scalar(
        select(Campaign).where(
            Campaign.status == CampaignStatus.active,
            Campaign.campaign_type == CampaignType.emergency,
            Campaign.deleted_at.is_(None),
        ).order_by(Campaign.created_at.desc())
    )

    # Latest published reminder
    reminder_db = db.scalar(
        select(DailyReminder).where(
            DailyReminder.status == ReminderStatus.published,
        ).order_by(DailyReminder.created_at.desc())
    )

    # Latest impact card
    impact_db = db.scalar(
        select(ImpactCard).where(
            ImpactCard.deleted_at.is_(None),
        ).order_by(ImpactCard.created_at.desc())
    )

    # Monthly progress — total active donors who contributed this month
    current_contributors = db.scalar(
        select(func.count(func.distinct(Contribution.user_id))).where(
            Contribution.contribution_month == month,
            Contribution.status.in_(
                [ContributionStatus.submitted, ContributionStatus.confirmed]
            ),
        )
    ) or 0

    total_active_donors = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor,
            User.deleted_at.is_(None),
        )
    ) or 0

    # User data (with extra computed fields)
    user_out = UserOut.model_validate(current_user)
    user_dict = user_out.model_dump()
    user_dict["pledge_status"] = pledge_status_str
    user_dict["donor_number"] = donor_number
    user_dict["is_collector"] = current_user.collector_profile is not None
    user_dict["collector_code"] = current_user.collector_code
    user_dict["badges"] = []

    pledge_summary = PledgeStatusOut(
        has_active_pledge=has_active_pledge,
        pledge=PledgeOut.model_validate(active_pledge) if active_pledge else None,
        confirmed_contributions_count=confirmed_count,
        current_month_contributed=current_month_contributed,
    )

    return MobileDashboardOut(
        user=user_dict,
        pledge_status=pledge_status_str,
        donor_number=donor_number,
        total_donors_today=total_donors_today,
        active_campaign=CampaignOut.model_validate(active_campaign_db) if active_campaign_db else None,
        emergency_appeal=CampaignOut.model_validate(emergency_db) if emergency_db else None,
        latest_reminder=ReminderOut.model_validate(reminder_db) if reminder_db else None,
        latest_impact=ImpactCardOut.model_validate(impact_db) if impact_db else None,
        monthly_progress=MonthlyProgress(
            target=max(total_active_donors, 1),
            current=current_contributors,
        ),
        pledge_summary=pledge_summary,
    )
