from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.campaign import Campaign
from app.models.contribution import Contribution
from app.models.enums import ContributionStatus
from app.models.user import User
from app.schemas.contribution import ContributionSubmit


def submit(db: Session, user: User, data: ContributionSubmit) -> Contribution:
    """Single canonical submit – creates a contribution in 'submitted' status."""
    contribution = Contribution(
        user_id=user.id,
        pledge_id=data.pledge_id,
        campaign_id=data.campaign_id,
        amount=data.amount,
        currency=data.currency,
        contribution_channel=data.contribution_channel,
        payment_link_used=data.payment_link_used,
        transaction_reference=data.transaction_reference,
        proof_image_url=data.proof_image_url,
        status=ContributionStatus.submitted,
        contribution_month=data.contribution_month,
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution


def get_my_contributions(
    db: Session, user_id: UUID, skip: int = 0, limit: int = 20
) -> Tuple[List[Contribution], int]:
    base = select(Contribution).where(Contribution.user_id == user_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(
            base.order_by(Contribution.created_at.desc()).offset(skip).limit(limit)
        ).all()
    )
    return items, total


def get_my_month(db: Session, user_id: UUID, month: str) -> List[Contribution]:
    return list(
        db.scalars(
            select(Contribution)
            .where(
                Contribution.user_id == user_id,
                Contribution.contribution_month == month,
            )
            .order_by(Contribution.created_at.desc())
        ).all()
    )


def _get(db: Session, contribution_id: UUID) -> Contribution:
    c = db.scalar(select(Contribution).where(Contribution.id == contribution_id))
    if not c:
        raise HTTPException(404, "Contribution not found")
    return c


def _audit(db: Session, admin: User, action: str, entity_id: str, meta: dict) -> None:
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action=action,
            entity_type="contribution",
            entity_id=entity_id,
            metadata_=meta,
        )
    )


def confirm(db: Session, admin: User, contribution_id: UUID) -> Contribution:
    c = _get(db, contribution_id)
    if c.status == ContributionStatus.confirmed:
        raise HTTPException(400, "Contribution already confirmed")

    prev_status = c.status.value
    c.status = ContributionStatus.confirmed
    c.confirmed_by = admin.id
    c.confirmed_at = datetime.now(timezone.utc)

    # Update campaign totals
    campaign = db.scalar(select(Campaign).where(Campaign.id == c.campaign_id))
    if campaign:
        campaign.raised_amount += c.amount
        campaign.donor_count += 1

    _audit(db, admin, "confirm", str(c.id), {"previous_status": prev_status})
    db.commit()
    db.refresh(c)
    return c


def reject(db: Session, admin: User, contribution_id: UUID, note: Optional[str] = None) -> Contribution:
    c = _get(db, contribution_id)
    if c.status == ContributionStatus.rejected:
        raise HTTPException(400, "Contribution already rejected")

    prev_status = c.status.value
    c.status = ContributionStatus.rejected
    c.rejected_by = admin.id
    c.rejected_at = datetime.now(timezone.utc)
    if note:
        c.admin_note = note

    _audit(db, admin, "reject", str(c.id), {"previous_status": prev_status, "note": note})
    db.commit()
    db.refresh(c)
    return c


def needs_follow_up(db: Session, admin: User, contribution_id: UUID) -> Contribution:
    c = _get(db, contribution_id)
    if c.status == ContributionStatus.needs_follow_up:
        raise HTTPException(400, "Contribution already marked needs_follow_up")

    prev_status = c.status.value
    c.status = ContributionStatus.needs_follow_up

    _audit(db, admin, "needs_follow_up", str(c.id), {"previous_status": prev_status})
    db.commit()
    db.refresh(c)
    return c


def admin_list(
    db: Session, skip: int = 0, limit: int = 20, status: Optional[ContributionStatus] = None
) -> Tuple[List[Contribution], int]:
    query = select(Contribution)
    if status:
        query = query.where(Contribution.status == status)
    base = query.order_by(Contribution.created_at.desc())
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.offset(skip).limit(limit)).all())
    return items, total
