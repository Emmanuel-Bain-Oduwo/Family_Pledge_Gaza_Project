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
from app.models.media_asset import MediaAsset
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.contribution import ContributionSubmit
from app.services.private_proof_service import retention_expires_at


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


def _validate_private_proof(
    db: Session, user: User, object_key: Optional[str]
) -> Optional[MediaAsset]:
    if not object_key:
        return None
    asset = db.scalar(select(MediaAsset).where(MediaAsset.object_key == object_key))
    if not asset:
        raise HTTPException(400, "Contribution proof upload was not found")
    if asset.uploaded_by != user.id:
        raise HTTPException(403, "Contribution proof belongs to another user")
    if asset.status != "uploaded":
        raise HTTPException(400, "Contribution proof upload is not complete")
    if asset.is_public:
        raise HTTPException(400, "Contribution proof must be stored privately")
    if asset.folder != "contribution_proofs":
        raise HTTPException(400, "Invalid contribution proof storage folder")
    if asset.related_entity_id is not None:
        raise HTTPException(400, "Contribution proof is already attached to a contribution")
    return asset


def _validate_pledge_ownership(db: Session, user: User, pledge_id: Optional[UUID]) -> None:
    if not pledge_id:
        return
    pledge = db.get(Pledge, pledge_id)
    if not pledge:
        raise HTTPException(400, "Pledge was not found")
    if pledge.user_id != user.id:
        raise HTTPException(403, "This pledge belongs to another user")


def sync_campaign_totals(db: Session, campaign_id: Optional[UUID]) -> None:
    """Make campaign totals a projection of the confirmed contribution ledger.

    Recalculating avoids double-counting whether a legacy admin review or an
    automated payment settlement changes the confirmed ledger.
    """
    if not campaign_id:
        return
    db.flush()
    campaign = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
    if not campaign:
        return
    total, count = db.execute(
        select(
            func.coalesce(func.sum(Contribution.amount), 0),
            func.count(Contribution.id),
        ).where(
            Contribution.campaign_id == campaign_id,
            Contribution.status == ContributionStatus.confirmed,
        )
    ).one()
    campaign.raised_amount = total or 0
    campaign.donor_count = int(count or 0)
    db.add(campaign)


def submit(db: Session, user: User, data: ContributionSubmit) -> Contribution:
    _validate_pledge_ownership(db, user, data.pledge_id)

    normalized_reference = None
    if data.transaction_reference:
        normalized_reference = str(data.transaction_reference).strip()
        if normalized_reference:
            duplicate = db.execute(
                select(Contribution).where(
                    func.lower(func.trim(Contribution.transaction_reference))
                    == normalized_reference.lower()
                )
            ).scalar_one_or_none()
            if duplicate:
                raise HTTPException(
                    status_code=400,
                    detail="Duplicate transaction reference detected.",
                )

    proof_asset = _validate_private_proof(db, user, data.proof_object_key)
    has_raw_proof = bool(
        normalized_reference or data.proof_object_key or data.proof_image_url
    )

    contribution = Contribution(
        user_id=user.id,
        pledge_id=data.pledge_id,
        campaign_id=data.campaign_id,
        amount=data.amount,
        currency=data.currency,
        contribution_channel=data.contribution_channel,
        payment_link_used=data.payment_link_used,
        transaction_reference=normalized_reference or None,
        # Legacy field is kept only while existing public proof records are
        # migrated. New clients send proof_object_key instead.
        proof_image_url=data.proof_image_url,
        proof_object_key=data.proof_object_key,
        proof_expires_at=retention_expires_at() if has_raw_proof else None,
        status=ContributionStatus.submitted,
        contribution_month=data.contribution_month,
    )
    db.add(contribution)
    db.flush()

    if proof_asset:
        proof_asset.related_entity_type = "contribution"
        proof_asset.related_entity_id = contribution.id

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


def admin_list(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: Optional[ContributionStatus] = None,
) -> Tuple[List[Contribution], int]:
    query = select(Contribution)
    if status:
        query = query.where(Contribution.status == status)
    base = query.order_by(Contribution.created_at.desc())
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.offset(skip).limit(limit)).all())
    return items, total


def _audit_meta(c: Contribution, prev_status: str, admin_note: Optional[str] = None) -> dict:
    """Keep immutable audit useful without copying 30-day raw proof/reference data."""
    meta = {
        "previous_status": prev_status,
        "new_status": c.status.value,
        "amount": str(c.amount) if c.amount is not None else None,
        "currency": c.currency,
        "had_transaction_reference": bool(c.transaction_reference),
        "had_private_proof": bool(c.proof_object_key),
    }
    if admin_note:
        meta["admin_note"] = admin_note
    return meta


def confirm(db: Session, admin: User, contribution_id: UUID) -> Contribution:
    c = _get(db, contribution_id)
    if c.status == ContributionStatus.confirmed:
        raise HTTPException(400, "Contribution already confirmed")

    prev_status = c.status.value
    c.status = ContributionStatus.confirmed
    c.confirmed_by = admin.id
    c.confirmed_at = datetime.now(timezone.utc)

    sync_campaign_totals(db, c.campaign_id)
    _audit(db, admin, "confirm", str(c.id), _audit_meta(c, prev_status))
    db.commit()
    db.refresh(c)
    return c


def reject(
    db: Session,
    admin: User,
    contribution_id: UUID,
    admin_note: Optional[str] = None,
) -> Contribution:
    c = _get(db, contribution_id)
    if c.status == ContributionStatus.rejected:
        raise HTTPException(400, "Contribution already rejected")

    prev_status = c.status.value
    c.status = ContributionStatus.rejected
    c.confirmed_by = None
    c.confirmed_at = None
    if admin_note:
        c.admin_note = admin_note

    sync_campaign_totals(db, c.campaign_id)
    _audit(db, admin, "reject", str(c.id), _audit_meta(c, prev_status, admin_note))
    db.commit()
    db.refresh(c)
    return c


def needs_follow_up(
    db: Session,
    admin: User,
    contribution_id: UUID,
    admin_note: Optional[str] = None,
) -> Contribution:
    c = _get(db, contribution_id)
    if c.status == ContributionStatus.needs_follow_up:
        raise HTTPException(400, "Contribution already marked needs_follow_up")

    prev_status = c.status.value
    c.status = ContributionStatus.needs_follow_up
    c.confirmed_by = None
    c.confirmed_at = None
    if admin_note:
        c.admin_note = admin_note

    sync_campaign_totals(db, c.campaign_id)
    _audit(db, admin, "needs_follow_up", str(c.id), _audit_meta(c, prev_status, admin_note))
    db.commit()
    db.refresh(c)
    return c
