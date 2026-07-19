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

    if c.campaign_id and c.amount:
        campaign = db.scalar(select(Campaign).where(Campaign.id == c.campaign_id))
        if campaign:
            campaign.raised_amount = float(campaign.raised_amount or 0) + float(c.amount)
            campaign.donor_count = int(campaign.donor_count or 0) + 1

    _audit(db, admin, "contribution.confirm", str(contribution_id), {"prev_status": prev_status})
    db.commit()
    db.refresh(c)
    return c


def reject(
    db: Session, admin: User, contribution_id: UUID, admin_note: Optional[str]
) -> Contribution:
    c = _get(db, contribution_id)
    c.status = ContributionStatus.rejected
    if admin_note is not None:
        c.admin_note = admin_note
    _audit(db, admin, "contribution.reject", str(contribution_id), {"note": admin_note})
    db.commit()
    db.refresh(c)
    return c


def needs_follow_up(
    db: Session, admin: User, contribution_id: UUID, admin_note: Optional[str]
) -> Contribution:
    c = _get(db, contribution_id)
    c.status = ContributionStatus.needs_follow_up
    if admin_note is not None:
        c.admin_note = admin_note
    _audit(db, admin, "contribution.needs_follow_up", str(contribution_id), {"note": admin_note})
    db.commit()
    db.refresh(c)
    return c


def admin_list(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: Optional[ContributionStatus] = None,
) -> Tuple[List[Contribution], int]:
    base = select(Contribution)
    if status:
        base = base.where(Contribution.status == status)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(
            base.order_by(Contribution.created_at.desc()).offset(skip).limit(limit)
        ).all()
    )
    return items, total

def _validate_transaction_reference_unique(db: Session, transaction_reference: str | None) -> None:
    """
    Raise a 400 HTTPException if a Contribution with this transaction reference already exists.
    Leading/trailing whitespace is stripped before comparison.
    """
    if transaction_reference is None:
        return
    cleaned = transaction_reference.strip()
    if not cleaned:
        return
    exists = db.scalar(
        select(func.count()).select_from(
            select(Contribution).where(
                func.trim(Contribution.transaction_reference) == cleaned
            ).subquery()
        )
    )
    if exists:
        raise HTTPException(status_code=400, detail="Duplicate transaction reference detected")


def submit(db: Session, user: User, data: ContributionSubmit) -> Contribution:
    # Duplicate transaction protection
    _validate_transaction_reference_unique(db, data.transaction_reference)

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
