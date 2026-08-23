from datetime import datetime, timezone
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
    PaymentStatus,
    PledgeType,
    ReminderStatus,
    UserRole,
)
from app.models.impact import ImpactCard
from app.models.reminder import DailyReminder
from app.models.user import User
from app.schemas.campaign import CampaignOut
from app.schemas.impact_card import ImpactCardOut
from app.schemas.common import PaginatedResponse, make_page
from app.schemas.notification import NotificationOut
from app.schemas.pledge import PledgeOut, PledgeStatusOut
from app.schemas.reminder import ReminderOut
from app.schemas.user import UserOut
from app.utils.validators import current_month
from app.services import notification_service, pledge_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Mobile"])


@router.get("/notifications", response_model=PaginatedResponse[NotificationOut])
def user_notifications(
    page: int = 1,
    size: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    size = min(max(size, 1), 100)
    skip, limit = offset_limit(page, size)
    items, total = notification_service.list_for_user(db, current_user, skip, limit)
    return make_page([NotificationOut.model_validate(item) for item in items], total, page, size)


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


def _normalize_payment_status(value: Any) -> Optional[PaymentStatus]:
    """Return only a known payment status for donor-facing responses.

    SQLAlchemy normally returns PaymentStatus directly, but treating this
    boundary defensively prevents an unexpected database/mock/provider value
    from breaking the entire mobile dashboard response.
    """
    if value is None:
        return None
    if isinstance(value, PaymentStatus):
        return value
    if isinstance(value, str):
        try:
            return PaymentStatus(value)
        except ValueError:
            return None
    return None


@router.get("/dashboard", response_model=MobileDashboardOut)
def mobile_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pledge_data = pledge_service.get_pledge_status(db, current_user.id)
    active_pledge = pledge_data["pledge"]
    current_month_status = pledge_data["current_month_status"]
    current_payment_status = _normalize_payment_status(
        pledge_data.get("current_month_payment_status")
    )

    if active_pledge is None:
        pledge_status_str = "none"
    elif active_pledge.pledge_type == PledgeType.free_participant:
        pledge_status_str = "free_participant"
    elif current_month_status == ContributionStatus.confirmed:
        pledge_status_str = "paid"
    elif current_payment_status in (
        PaymentStatus.created,
        PaymentStatus.initiating,
        PaymentStatus.pending,
    ):
        # Keep the existing dashboard status wire value for backward-compatible
        # mobile clients; the card now renders it as payment Processing.
        pledge_status_str = "submitted"
    elif current_month_status == ContributionStatus.needs_follow_up:
        pledge_status_str = "needs_follow_up"
    elif current_month_status == ContributionStatus.rejected:
        pledge_status_str = "rejected"
    else:
        pledge_status_str = "pending"

    month = current_month()

    donor_number = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor,
            User.created_at <= current_user.created_at,
            User.deleted_at.is_(None),
        )
    ) or 1

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total_donors_today = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor,
            User.created_at >= today_start,
            User.deleted_at.is_(None),
        )
    ) or 0

    active_campaign_db = db.scalar(
        select(Campaign).where(
            Campaign.status == CampaignStatus.active,
            Campaign.campaign_type != CampaignType.emergency,
            Campaign.deleted_at.is_(None),
        ).order_by(Campaign.created_at.desc())
    )

    emergency_db = db.scalar(
        select(Campaign).where(
            Campaign.status == CampaignStatus.active,
            Campaign.campaign_type == CampaignType.emergency,
            Campaign.deleted_at.is_(None),
        ).order_by(Campaign.created_at.desc())
    )

    reminder_db = db.scalar(
        select(DailyReminder).where(
            DailyReminder.status == ReminderStatus.published,
        ).order_by(DailyReminder.created_at.desc())
    )

    impact_db = db.scalar(
        select(ImpactCard)
        .where(ImpactCard.published.is_(True))
        .order_by(ImpactCard.created_at.desc())
    )

    # Real contribution progress is money actually confirmed in the ledger.
    # Pending STK requests do not count as contributions.
    current_contributors = db.scalar(
        select(func.count(func.distinct(Contribution.user_id))).where(
            Contribution.contribution_month == month,
            Contribution.status == ContributionStatus.confirmed,
        )
    ) or 0

    total_active_donors = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor,
            User.deleted_at.is_(None),
        )
    ) or 0

    user_out = UserOut.model_validate(current_user)
    user_dict = user_out.model_dump()
    user_dict["pledge_status"] = pledge_status_str
    user_dict["donor_number"] = donor_number
    user_dict["is_collector"] = current_user.collector_profile is not None
    user_dict["collector_code"] = current_user.collector_code
    user_dict["badges"] = []

    pledge_summary = PledgeStatusOut(
        has_active_pledge=pledge_data["has_active_pledge"],
        pledge=PledgeOut.model_validate(active_pledge) if active_pledge else None,
        confirmed_contributions_count=pledge_data["confirmed_contributions_count"],
        current_month_contributed=pledge_data["current_month_contributed"],
        current_month_status=current_month_status,
        current_month_payment_status=current_payment_status,
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
