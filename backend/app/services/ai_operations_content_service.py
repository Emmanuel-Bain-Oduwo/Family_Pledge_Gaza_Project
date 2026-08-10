import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ai_operations import AiGeneratedContent
from app.models.audit import AdminAuditLog
from app.models.enums import AiContentStatus
from app.models.user import User
from app.services.ai_provider_service import call_ai
from app.services.ai_workspace_service import is_in_scope

CONTENT_SYSTEM_PROMPT = """You are the Family Pledge internal content-drafting assistant.
Draft only content related to Family Pledge/NAMLEF, Gaza/Palestine humanitarian donations,
or relevant Islamic charity/reminder context. Never invent donation statistics, beneficiary
counts, Quran verses, hadith citations, donor identity, payment details, or guaranteed
religious rewards. The result is a draft requiring admin review. You cannot send, publish,
approve, reject, confirm, delete, or modify any record. Return JSON only with string keys
`title` and `body`."""


def generate_content_draft(
    db: Session,
    admin: User,
    prompt: str,
    content_type: str,
    channel: str,
) -> AiGeneratedContent:
    if not is_in_scope(prompt):
        raise HTTPException(
            400,
            "AI content generation is limited to Family Pledge, Gaza humanitarian donations, and relevant Islamic context.",
        )

    raw = call_ai(
        system_prompt=CONTENT_SYSTEM_PROMPT,
        user_prompt=(
            f"Content type: {content_type}\n"
            f"Channel: {channel}\n"
            f"Admin request: {prompt}\n"
            "Return JSON only: {\"title\": \"...\", \"body\": \"...\"}."
        ),
        max_tokens=700,
        temperature=0.35,
    )
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "", 1).replace("```", "").strip()
        parsed = json.loads(cleaned)
        title = str(parsed.get("title") or "").strip()[:255]
        body = str(parsed.get("body") or "").strip()
    except (ValueError, TypeError) as exc:
        raise HTTPException(502, "AI provider returned an invalid draft format") from exc
    if not title or not body:
        raise HTTPException(502, "AI provider returned an incomplete draft")

    content = AiGeneratedContent(
        created_by_admin_id=admin.id,
        content_type=content_type,
        channel=channel,
        title=title,
        body=body,
        status=AiContentStatus.pending_approval,
    )
    db.add(content)
    db.flush()
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_content.generate",
            entity_type="ai_generated_content",
            entity_id=str(content.id),
            metadata_={"content_type": content_type, "channel": channel, "provider_fallback": False},
        )
    )
    db.commit()
    db.refresh(content)
    return content
