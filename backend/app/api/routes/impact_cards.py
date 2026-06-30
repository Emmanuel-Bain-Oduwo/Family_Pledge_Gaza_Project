from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse, make_page
from app.schemas.impact_card import ImpactCardCreate, ImpactCardOut, ImpactCardUpdate
from app.services import impact_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Impact Cards"])


@router.get("/impact-cards", response_model=PaginatedResponse[ImpactCardOut])
def list_impact_cards(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = impact_service.list_cards(db, skip, limit)
    return make_page([ImpactCardOut.model_validate(c) for c in items], total, page, size)


@router.get("/impact-cards/{card_id}", response_model=ImpactCardOut)
def get_impact_card(card_id: UUID, db: Session = Depends(get_db)):
    return impact_service.get_by_id(db, card_id)


@router.post("/admin/impact-cards", response_model=ImpactCardOut, status_code=201)
def admin_create_impact_card(
    data: ImpactCardCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return impact_service.create(db, admin, data)


@router.patch("/admin/impact-cards/{card_id}", response_model=ImpactCardOut)
def admin_update_impact_card(
    card_id: UUID,
    data: ImpactCardUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return impact_service.update(db, admin, card_id, data)


@router.delete("/admin/impact-cards/{card_id}", response_model=MessageResponse)
def admin_delete_impact_card(
    card_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    impact_service.delete(db, admin, card_id)
    return MessageResponse(message="Impact card deleted")
