from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin, require_collector
from app.models.user import User
from app.schemas.collector import (
    CollectorCreate,
    CollectorDashboardOut,
    CollectorMemberAdd,
    CollectorMemberOut,
    CollectorOut,
    CollectorWithMemberCount,
    InviteCodeOut,
)
from app.schemas.common import MessageResponse, PaginatedResponse, make_page
from app.services import collector_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Collectors"])


@router.get("/collectors/me/dashboard", response_model=CollectorDashboardOut)
def my_dashboard(
    current_user: User = Depends(require_collector),
    db: Session = Depends(get_db),
):
    data = collector_service.get_dashboard(db, current_user)
    return CollectorDashboardOut(
        collector=CollectorOut.model_validate(data["collector"]),
        member_count=data["member_count"],
        confirmed_this_month=data["confirmed_this_month"],
        pending_this_month=data["pending_this_month"],
        total_confirmed=data["total_confirmed"],
    )


@router.get("/collectors/me/members", response_model=List[CollectorMemberOut])
def my_members(
    current_user: User = Depends(require_collector),
    db: Session = Depends(get_db),
):
    return [CollectorMemberOut(**m) for m in collector_service.get_members(db, current_user)]


@router.post("/collectors/me/invite-code", response_model=InviteCodeOut)
def my_invite_code(
    current_user: User = Depends(require_collector),
    db: Session = Depends(get_db),
):
    code = collector_service.generate_invite_code(db, current_user)
    return InviteCodeOut(collector_code=code)


@router.get("/admin/collectors", response_model=PaginatedResponse[CollectorOut])
def admin_list_collectors(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = collector_service.admin_list(db, skip, limit)
    return make_page([CollectorOut.model_validate(c) for c in items], total, page, size)


@router.post("/admin/collectors", response_model=CollectorOut, status_code=201)
def admin_create_collector(
    data: CollectorCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return collector_service.admin_create(db, admin, data)


@router.post(
    "/admin/collectors/{collector_id}/members",
    response_model=MessageResponse,
    status_code=201,
)
def admin_add_member(
    collector_id: UUID,
    data: CollectorMemberAdd,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    collector_service.admin_add_member(db, admin, collector_id, data)
    return MessageResponse(message="Member added to collector circle")


@router.delete(
    "/admin/collectors/{collector_id}/members/{donor_user_id}",
    response_model=MessageResponse,
)
def admin_remove_member(
    collector_id: UUID,
    donor_user_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    collector_service.admin_remove_member(db, admin, collector_id, donor_user_id)
    return MessageResponse(message="Member removed from collector circle")
