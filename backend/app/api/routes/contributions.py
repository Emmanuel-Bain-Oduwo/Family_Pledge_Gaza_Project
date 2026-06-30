from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.enums import ContributionStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse, make_page
from app.schemas.contribution import (
    AdminNoteRequest,
    ContributionAdminOut,
    ContributionOut,
    ContributionSubmit,
)
from app.services import contribution_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Contributions"])


# ── Donor routes ──────────────────────────────────────────────────────────────

@router.post("/contributions/submit", response_model=ContributionOut, status_code=201)
def submit_contribution(
    data: ContributionSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return contribution_service.submit(db, current_user, data)


@router.get("/contributions/me", response_model=PaginatedResponse[ContributionOut])
def my_contributions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = contribution_service.get_my_contributions(db, current_user.id, skip, limit)
    return make_page([ContributionOut.model_validate(i) for i in items], total, page, size)


@router.get("/contributions/me/month/{yyyy_mm}", response_model=List[ContributionOut])
def my_month_contributions(
    yyyy_mm: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return contribution_service.get_my_month(db, current_user.id, yyyy_mm)


# ── Admin routes ──────────────────────────────────────────────────────────────

@router.get("/admin/contributions", response_model=PaginatedResponse[ContributionAdminOut])
def admin_list_contributions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[ContributionStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.core.deps import require_admin
    from app.models.enums import UserRole
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        from fastapi import HTTPException
        raise HTTPException(403, "Admin access required")

    skip, limit = offset_limit(page, size)
    items, total = contribution_service.admin_list(db, skip, limit, status)

    out = []
    for c in items:
        row = ContributionAdminOut.model_validate(c)
        if c.user:
            row.user_full_name = c.user.full_name
            row.user_phone = c.user.phone
            row.user_email = c.user.email
        out.append(row)

    return make_page(out, total, page, size)


@router.patch("/admin/contributions/{contribution_id}/confirm", response_model=ContributionOut)
def admin_confirm(
    contribution_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.enums import UserRole
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        from fastapi import HTTPException
        raise HTTPException(403, "Admin access required")
    return contribution_service.confirm(db, current_user, contribution_id)


@router.patch("/admin/contributions/{contribution_id}/reject", response_model=ContributionOut)
def admin_reject(
    contribution_id: UUID,
    data: AdminNoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.enums import UserRole
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        from fastapi import HTTPException
        raise HTTPException(403, "Admin access required")
    return contribution_service.reject(db, current_user, contribution_id, data.admin_note)


@router.patch(
    "/admin/contributions/{contribution_id}/needs-follow-up", response_model=ContributionOut
)
def admin_needs_follow_up(
    contribution_id: UUID,
    data: AdminNoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.enums import UserRole
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        from fastapi import HTTPException
        raise HTTPException(403, "Admin access required")
    return contribution_service.needs_follow_up(db, current_user, contribution_id, data.admin_note)
