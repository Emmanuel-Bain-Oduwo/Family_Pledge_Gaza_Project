from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.ai_draft import (
    AiCollectorMessageRequest,
    AiDraftOut,
    AiImpactUpdateRequest,
    AiReminderRequest,
    AiWeeklySummaryRequest,
)
from app.schemas.common import PaginatedResponse, make_page
from app.services import ai_service
from app.utils.pagination import offset_limit

router = APIRouter(prefix="/admin/ai", tags=["AI Assistant"])


@router.post("/reminder-draft", response_model=AiDraftOut, status_code=201)
def generate_reminder(
    data: AiReminderRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ai_service.generate_reminder(db, admin, data)


@router.post("/impact-update-draft", response_model=AiDraftOut, status_code=201)
def generate_impact_update(
    data: AiImpactUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ai_service.generate_impact_update(db, admin, data)


@router.post("/weekly-summary", response_model=AiDraftOut, status_code=201)
def generate_weekly_summary(
    data: AiWeeklySummaryRequest = AiWeeklySummaryRequest(),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ai_service.generate_weekly_summary(db, admin, data)


@router.post("/collector-message-draft", response_model=AiDraftOut, status_code=201)
def generate_collector_message(
    data: AiCollectorMessageRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ai_service.generate_collector_message(db, admin, data)


@router.get("/drafts", response_model=PaginatedResponse[AiDraftOut])
def list_drafts(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    draft_type: str | None = Query(None, description="Filter by draft type"),
    status: str | None = Query(None, description="Filter by status"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = ai_service.list_drafts(db, admin, skip, limit, draft_type, status)
    return make_page([AiDraftOut.model_validate(d) for d in items], total, page, size)


@router.patch("/drafts/{draft_id}/approve", response_model=AiDraftOut)
def approve_draft(
    draft_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ai_service.approve_draft(db, admin, draft_id)


@router.patch("/drafts/{draft_id}/reject", response_model=AiDraftOut)
def reject_draft(
    draft_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ai_service.reject_draft(db, admin, draft_id)


@router.patch("/drafts/{draft_id}/publish", response_model=AiDraftOut)
def publish_draft(
    draft_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Mark an approved draft as published/ready-to-use. Does not send anything automatically."""
    return ai_service.publish_draft(db, admin, draft_id)
