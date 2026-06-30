from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.campaign import Campaign
from app.models.enums import CampaignStatus
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignUpdate


def list_campaigns(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: Optional[CampaignStatus] = None,
) -> Tuple[List[Campaign], int]:
    base = select(Campaign).where(Campaign.deleted_at.is_(None))
    if status:
        base = base.where(Campaign.status == status)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(base.order_by(Campaign.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def get_active(db: Session) -> List[Campaign]:
    return list(
        db.scalars(
            select(Campaign)
            .where(Campaign.status == CampaignStatus.active, Campaign.deleted_at.is_(None))
            .order_by(Campaign.starts_at.desc())
        ).all()
    )


def get_by_id(db: Session, campaign_id: UUID) -> Campaign:
    campaign = db.scalar(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.deleted_at.is_(None))
    )
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    return campaign


def create(db: Session, admin: User, data: CampaignCreate) -> Campaign:
    campaign = Campaign(
        title=data.title,
        campaign_type=data.campaign_type,
        description=data.description,
        target_amount=data.target_amount,
        donor_target=data.donor_target,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
        cover_image_url=data.cover_image_url,
        video_url=data.video_url,
        status=data.status,
        created_by=admin.id,
    )
    db.add(campaign)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="campaign.create",
            entity_type="campaign",
            entity_id=None,
            metadata_={"title": data.title},
        )
    )
    db.commit()
    db.refresh(campaign)
    return campaign


def update(db: Session, admin: User, campaign_id: UUID, data: CampaignUpdate) -> Campaign:
    campaign = get_by_id(db, campaign_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(campaign, field, value)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="campaign.update",
            entity_type="campaign",
            entity_id=str(campaign_id),
            metadata_={},
        )
    )
    db.commit()
    db.refresh(campaign)
    return campaign


def delete(db: Session, admin: User, campaign_id: UUID) -> None:
    campaign = get_by_id(db, campaign_id)
    campaign.deleted_at = datetime.now(timezone.utc)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="campaign.delete",
            entity_type="campaign",
            entity_id=str(campaign_id),
            metadata_={},
        )
    )
    db.commit()
