from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignOut, CampaignUpdate
from app.schemas.common import MessageResponse, PaginatedResponse, make_page
from app.services import campaign_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Campaigns"])


@router.get("/campaigns", response_model=PaginatedResponse[CampaignOut])
def list_campaigns(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = campaign_service.list_campaigns(db, skip, limit)
    return make_page([CampaignOut.model_validate(c) for c in items], total, page, size)


@router.get("/campaigns/active", response_model=List[CampaignOut])
def list_active_campaigns(db: Session = Depends(get_db)):
    return campaign_service.get_active(db)


@router.get("/campaigns/{campaign_id}", response_model=CampaignOut)
def get_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    return campaign_service.get_by_id(db, campaign_id)


@router.post("/admin/campaigns", response_model=CampaignOut, status_code=201)
def admin_create_campaign(
    data: CampaignCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return campaign_service.create(db, admin, data)


@router.patch("/admin/campaigns/{campaign_id}", response_model=CampaignOut)
def admin_update_campaign(
    campaign_id: UUID,
    data: CampaignUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return campaign_service.update(db, admin, campaign_id, data)


@router.delete("/admin/campaigns/{campaign_id}", response_model=MessageResponse)
def admin_delete_campaign(
    campaign_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    campaign_service.delete(db, admin, campaign_id)
    return MessageResponse(message="Campaign deleted")
