from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ai_draft import AiDraft
from app.models.audit import AdminAuditLog
from app.models.enums import AiDraftStatus
from app.models.user import User


def update_draft_text(
    db: Session,
    admin: User,
    draft_id: UUID,
    generated_text: str,
) -> AiDraft:
    draft = db.scalar(select(AiDraft).where(AiDraft.id == draft_id))
    if draft is None:
        raise HTTPException(404, "Draft not found")
    if draft.status != AiDraftStatus.draft:
        raise HTTPException(400, "Only unapproved drafts can be edited")

    text = generated_text.strip()
    if not text:
        raise HTTPException(400, "Draft text cannot be empty")

    draft.generated_text = text
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_draft.edit",
            entity_type="ai_draft",
            entity_id=str(draft.id),
            metadata_={"characters": len(text)},
        )
    )
    db.commit()
    db.refresh(draft)
    return draft
