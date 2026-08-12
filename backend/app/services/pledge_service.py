from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.contribution import Contribution
from app.models.enums import ContributionStatus, PledgeStatus
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.pledge import PledgeCreate, PledgeUpdate
from app.utils.validators import current_month

PLEDGE_AGREEMENT_VERSION = "2026-08-v2"


def _resolve_current_month_status(statuses: List[ContributionStatus]) -> Optional[ContributionStatus]:
    """Return the most meaningful donor-facing state for the current month."""
    for status in (
        ContributionStatus.confirmed,
        ContributionStatus.submitted,
        ContributionStatus.needs_follow_up,
        ContributionStatus.rejected,
    ):
        if status in statuses:
            return status
    return None


def create_pledge(db: Session, user: User, data: PledgeCreate) -> Pledge:
    existing = db.scalar(
        select(Pledge).where(
            Pledge.user_id == user.id,
            Pledge.status == PledgeStatus.active,
        )
    )
    accepted_at = datetime.now(timezone.utc)
    if existing:
        existing.amount = data.amount
        existing.currency = data.currency
        existing.pledge_type = data.pledge_type
        existing.start_date = data.start_date
        existing.agreement_accepted_at = accepted_at
        existing.agreement_version = PLEDGE_AGREEMENT_VERSION
        db.commit()
        db.refresh(existing)
        return existing

    pledge = Pledge(
        user_id=user.id,
        amount=data.amount,
        currency=data.currency,
        pledge_type=data.pledge_type,
        status=PledgeStatus.active,
        start_date=data.start_date,
        agreement_accepted_at=accepted_at,
        agreement_version=PLEDGE_AGREEMENT_VERSION,
    )
    db.add(pledge)
    db.commit()
    db.refresh(pledge)
    return pledge


def get_my_pledges(db: Session, user_id: UUID) -> List[Pledge]:
    return list(
        db.scalars(
            select(Pledge)
            .where(Pledge.user_id == user_id)
            .order_by(Pledge.created_at.desc())
        ).all()
    )


def get_pledge(db: Session, pledge_id: UUID, user_id: UUID) -> Pledge:
    pledge = db.scalar(
        select(Pledge).where(Pledge.id == pledge_id, Pledge.user_id == user_id)
    )
    if not pledge:
        raise HTTPException(404, "Pledge not found")
    return pledge


def update_pledge(db: Session, user: User, pledge_id: UUID, data: PledgeUpdate) -> Pledge:
    pledge = get_pledge(db, pledge_id, user.id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(pledge, field, value)
    db.commit()
    db.refresh(pledge)
    return pledge


def get_pledge_status(db: Session, user_id: UUID) -> dict:
    pledge = db.scalar(
        select(Pledge).where(
            Pledge.user_id == user_id,
            Pledge.status == PledgeStatus.active,
        )
    )

    confirmed_count = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.user_id == user_id,
            Contribution.status == ContributionStatus.confirmed,
        )
    ) or 0

    month = current_month()
    statuses = list(
        db.scalars(
            select(Contribution.status).where(
                Contribution.user_id == user_id,
                Contribution.contribution_month == month,
            )
        ).all()
    )
    current_month_status = _resolve_current_month_status(statuses)

    return {
        "has_active_pledge": pledge is not None,
        "pledge": pledge,
        "confirmed_contributions_count": confirmed_count,
        "current_month_contributed": current_month_status
        in (ContributionStatus.submitted, ContributionStatus.confirmed),
        "current_month_status": current_month_status,
    }
