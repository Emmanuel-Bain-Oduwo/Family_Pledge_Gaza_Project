from fastapi import APIRouter, Depends, Query
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
from app.schemas.admin import AdminDonorOut, DashboardOut
from app.schemas.common import PaginatedResponse, make_page
from app.utils.pagination import offset_limit
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
            "type": log.entity_type,
            "message": f"{log.action.replace('.', ' ').title()} — {log.entity_type}",
            "timestamp": log.created_at.isoformat(),
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
        total_raised_tracked=float(total_campaign_raised),
        collectors_count=collectors_count,
        latest_activity=latest_activity,
        recent_activity=latest_activity,
    )


@router.get("/donors", response_model=PaginatedResponse[AdminDonorOut])
def list_donors(
    search: str | None = Query(None),
    country: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    query = select(User).where(User.role == UserRole.donor, User.deleted_at.is_(None))
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            func.lower(User.full_name).like(pattern)
            | func.lower(User.phone).like(pattern)
            | func.lower(User.email).like(pattern)
        )
    if country:
        query = query.where(User.country == country)

    users = list(db.scalars(query.order_by(User.created_at.desc())).all())
    month = current_month()
    rows: list[AdminDonorOut] = []
    for index, user in enumerate(users, start=1):
        active_pledge = db.scalar(
            select(Pledge).where(Pledge.user_id == user.id, Pledge.status == PledgeStatus.active)
            .order_by(Pledge.created_at.desc())
        )
        confirmed_this_month = db.scalar(
            select(func.count(Contribution.id)).where(
                Contribution.user_id == user.id,
                Contribution.contribution_month == month,
                Contribution.status == ContributionStatus.confirmed,
            )
        ) or 0
        submitted_this_month = db.scalar(
            select(func.count(Contribution.id)).where(
                Contribution.user_id == user.id,
                Contribution.contribution_month == month,
                Contribution.status == ContributionStatus.submitted,
            )
        ) or 0
        if not active_pledge:
            pledge_status = "none"
        elif active_pledge.pledge_type.value == "free_participant":
            pledge_status = "free_participant"
        elif confirmed_this_month:
            pledge_status = "paid"
        elif submitted_this_month:
            pledge_status = "pending"
        else:
            pledge_status = "pending"
        if status and pledge_status != status:
            continue
        rows.append(AdminDonorOut(
            id=str(user.id),
            full_name=user.full_name,
            nickname=user.nickname,
            phone=user.phone,
            email=user.email,
            country=user.country,
            city=user.city,
            anonymous_publicly=user.anonymous_publicly,
            is_collector=bool(user.collector_profile),
            collector_code=user.collector_code,
            pledge_status=pledge_status,
            donor_number=index,
            created_at=user.created_at.isoformat(),
        ))

    total = len(rows)
    return make_page(rows[skip:skip + limit], total, page, size)
