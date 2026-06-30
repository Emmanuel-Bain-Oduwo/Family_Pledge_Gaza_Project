from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.audit import AdminAuditLog
from app.models.campaign import Campaign
from app.models.collector import Collector
from app.models.contribution import Contribution
from app.models.enums import CampaignStatus, ContributionStatus, PledgeStatus, UserRole
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.admin import DashboardOut
from app.utils.validators import current_month

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_donors = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor, User.deleted_at.is_(None)
        )
    ) or 0

    active_pledges = db.scalar(
        select(func.count(Pledge.id)).where(Pledge.status == PledgeStatus.active)
    ) or 0

    month = current_month()
    contributions_this_month = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.contribution_month == month
        )
    ) or 0

    pending_contributions = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.status == ContributionStatus.submitted
        )
    ) or 0

    active_campaigns = db.scalar(
        select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.active,
            Campaign.deleted_at.is_(None),
        )
    ) or 0

    total_campaign_raised = db.scalar(
        select(func.coalesce(func.sum(Campaign.raised_amount), 0)).where(
            Campaign.deleted_at.is_(None)
        )
    ) or 0.0

    collectors_count = db.scalar(select(func.count(Collector.id))) or 0

    recent_logs = db.scalars(
        select(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .limit(10)
    ).all()

    latest_activity = [
        {
            "id": str(log.id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "admin_id": str(log.admin_id),
            "created_at": log.created_at.isoformat(),
        }
        for log in recent_logs
    ]

    return DashboardOut(
        total_donors=total_donors,
        active_pledges=active_pledges,
        contributions_this_month=contributions_this_month,
        pending_contributions=pending_contributions,
        active_campaigns=active_campaigns,
        total_campaign_raised=float(total_campaign_raised),
        collectors_count=collectors_count,
        latest_activity=latest_activity,
    )
