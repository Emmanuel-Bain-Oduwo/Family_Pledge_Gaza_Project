from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.audit import AdminAuditLog
from app.models.user import User
from app.schemas.ai_chat import AiChatOut, AiChatRequest
from app.schemas.ai_draft import (
    AiCollectorMessageRequest,
    AiDraftOut,
    AiDraftUpdateRequest,
    AiImpactUpdateRequest,
    AiReminderRequest,
    AiWeeklySummaryRequest,
)
from app.schemas.common import PaginatedResponse, make_page
from app.services import ai_draft_edit_service, ai_flexible_chat_service, ai_provider_service, ai_service
from app.utils.pagination import offset_limit

router = APIRouter(prefix="/admin/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=AiChatOut)
def chat(
    data: AiChatRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    result = ai_flexible_chat_service.answer_admin_question(
        db,
        data.message,
        [item.model_dump() for item in data.history],
    )
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_chat.query",
            entity_type="ai_workspace",
            entity_id=None,
            metadata_={
                "context_tools": [block["name"] for block in result["context_used"]],
                "message_characters": len(data.message),
            },
        )
    )
    db.commit()
    return result


@router.post("/chat-image", response_model=AiChatOut)
async def chat_with_image(
    message: str = Form(...),
    image: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    prompt = message.strip()
    if len(prompt) < 2 or len(prompt) > 4000:
        raise HTTPException(422, "Image question must be between 2 and 4000 characters")
    content_type = (image.content_type or "").lower()
    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Choose a JPG, PNG, or WebP image")

    max_bytes = settings.AI_VISION_MAX_IMAGE_MB * 1024 * 1024
    image_bytes = await image.read(max_bytes + 1)
    if len(image_bytes) > max_bytes:
        raise HTTPException(413, f"Image must be {settings.AI_VISION_MAX_IMAGE_MB} MB or smaller")
    if not image_bytes:
        raise HTTPException(422, "The selected image is empty")

    answer = ai_provider_service.call_vision_ai(
        prompt=prompt,
        image_bytes=image_bytes,
        content_type=content_type,
    )
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_chat.image_query",
            entity_type="ai_workspace",
            entity_id=None,
            metadata_={
                "message_characters": len(prompt),
                "image_content_type": content_type,
                "image_bytes": len(image_bytes),
                "image_persisted": False,
            },
        )
    )
    db.commit()
    return AiChatOut(
        answer=answer,
        context_used=[],
        scope="family_pledge_admin_vision",
        actions_executed=[],
    )


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


@router.patch("/drafts/{draft_id}", response_model=AiDraftOut)
def edit_draft(
    draft_id: UUID,
    data: AiDraftUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ai_draft_edit_service.update_draft_text(
        db, admin, draft_id, data.generated_text
    )


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
