from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse, make_page
from app.schemas.namlef import NamlefContentCreate, NamlefContentOut, NamlefContentUpdate
from app.services import namlef_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["NAMLEF Content"])


@router.get("/namlef-content", response_model=PaginatedResponse[NamlefContentOut])
def list_namlef_content(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = namlef_service.list_published(db, skip, limit)
    return make_page([NamlefContentOut.model_validate(c) for c in items], total, page, size)


@router.get("/namlef-content/featured", response_model=List[NamlefContentOut])
def list_featured_namlef(db: Session = Depends(get_db)):
    return namlef_service.list_featured(db)


@router.post("/admin/namlef-content", response_model=NamlefContentOut, status_code=201)
def admin_create_namlef(
    data: NamlefContentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return namlef_service.create(db, admin, data)


@router.patch("/admin/namlef-content/{content_id}", response_model=NamlefContentOut)
def admin_update_namlef(
    content_id: UUID,
    data: NamlefContentUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return namlef_service.update(db, admin, content_id, data)


@router.delete("/admin/namlef-content/{content_id}", response_model=MessageResponse)
def admin_delete_namlef(
    content_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    namlef_service.delete(db, admin, content_id)
    return MessageResponse(message="Content archived")
