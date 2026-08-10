from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.contribution import Contribution
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
from app.services.private_proof_service import create_view_url
from app.utils.pagination import offset_limit
from app.utils.validators import current_month

router = APIRouter(tags=["Contributions"])


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


@router.get("/admin/contributions", response_model=PaginatedResponse[ContributionAdminOut])
def admin_list_contributions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[ContributionStatus] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = contribution_service.admin_list(db, skip, limit, status)

    now = datetime.now(timezone.utc)
    out = []
    for c in items:
        row = ContributionAdminOut.model_validate(c)
        if c.user:
            row.user_full_name = c.user.full_name
            row.user_phone = c.user.phone
            row.user_email = c.user.email
        not_expired = not c.proof_expires_at or c.proof_expires_at > now
        row.proof_available = bool(not_expired and (c.proof_object_key or c.proof_image_url))
        row.proof_expires_at = c.proof_expires_at
        out.append(row)

    return make_page(out, total, page, size)


@router.get("/admin/contributions-summary")
def admin_contribution_summary(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(Contribution.status, func.count(Contribution.id)).group_by(Contribution.status)
    ).all()
    counts = {status.value: int(count) for status, count in rows}
    month = current_month()
    month_count = int(db.scalar(select(func.count(Contribution.id)).where(Contribution.contribution_month == month)) or 0)
    return {
        "total": sum(counts.values()),
        "this_month": month_count,
        "submitted": counts.get(ContributionStatus.submitted.value, 0),
        "confirmed": counts.get(ContributionStatus.confirmed.value, 0),
        "rejected": counts.get(ContributionStatus.rejected.value, 0),
        "needs_follow_up": counts.get(ContributionStatus.needs_follow_up.value, 0),
    }


@router.get("/admin/contributions/{contribution_id}/proof-url")
def admin_contribution_proof_url(
    contribution_id: UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    contribution = db.scalar(select(Contribution).where(Contribution.id == contribution_id))
    if not contribution:
        raise HTTPException(404, "Contribution not found")

    now = datetime.now(timezone.utc)
    if contribution.proof_expires_at and contribution.proof_expires_at <= now:
        raise HTTPException(410, "Contribution proof has expired under the retention policy")

    if contribution.proof_object_key:
        return {"url": create_view_url(contribution.proof_object_key), "expires_in": settings.PROOF_SIGNED_GET_TTL_SECONDS, "legacy": False}

    if contribution.proof_image_url:
        return {"url": contribution.proof_image_url, "expires_in": None, "legacy": True}
    raise HTTPException(404, "No contribution proof is available")


@router.patch("/admin/contributions/{contribution_id}/confirm", response_model=ContributionOut)
def admin_confirm(
    contribution_id: UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return contribution_service.confirm(db, current_user, contribution_id)


@router.patch("/admin/contributions/{contribution_id}/reject", response_model=ContributionOut)
def admin_reject(
    contribution_id: UUID,
    data: AdminNoteRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return contribution_service.reject(db, current_user, contribution_id, data.admin_note)


@router.patch("/admin/contributions/{contribution_id}/needs-follow-up", response_model=ContributionOut)
def admin_needs_follow_up(
    contribution_id: UUID,
    data: AdminNoteRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return contribution_service.needs_follow_up(db, current_user, contribution_id, data.admin_note)


@router.patch("/admin/contributions/{contribution_id}/review", response_model=ContributionOut)
def admin_review_contribution(
    contribution_id: UUID,
    data: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    status = data.get("status")
    admin_note = data.get("admin_note")
    if status == ContributionStatus.confirmed.value:
        return contribution_service.confirm(db, current_user, contribution_id)
    if status == ContributionStatus.rejected.value:
        return contribution_service.reject(db, current_user, contribution_id, admin_note)
    if status == ContributionStatus.needs_follow_up.value:
        return contribution_service.needs_follow_up(db, current_user, contribution_id, admin_note)
    raise HTTPException(400, "Unsupported contribution review status")
