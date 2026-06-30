from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

import httpx
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_draft import AiDraft
from app.models.audit import AdminAuditLog
from app.models.enums import AiDraftStatus, AiDraftType
from app.models.user import User
from app.schemas.ai_draft import (
    AiCollectorMessageRequest,
    AiImpactUpdateRequest,
    AiReminderRequest,
    AiWeeklySummaryRequest,
)


def _call_openai(prompt: str) -> str:
    if not settings.OPENAI_API_KEY:
        return (
            "[AI draft placeholder — configure OPENAI_API_KEY to generate real content]\n\n"
            + prompt
        )
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.OPENAI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a compassionate Islamic content writer for Family Pledge, "
                    "a humanitarian platform raising funds for Gaza relief under NAMLEF. "
                    "Write in a warm, faith-centred, respectful tone. Keep content concise and impactful."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 800,
        "temperature": 0.7,
    }
    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
            )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"OpenAI API error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(502, f"AI generation failed: {str(e)}")


def _save_draft(
    db: Session,
    admin: User,
    draft_type: AiDraftType,
    generated_text: str,
    input_context: Optional[Dict[str, Any]],
) -> AiDraft:
    draft = AiDraft(
        admin_id=admin.id,
        draft_type=draft_type,
        input_context=input_context,
        generated_text=generated_text,
        status=AiDraftStatus.draft,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def generate_reminder(db: Session, admin: User, data: AiReminderRequest) -> AiDraft:
    prompt = (
        f"Write an Islamic daily reminder for a Gaza relief fundraising app.\n"
        f"Type: {data.reminder_type}\n"
        f"Topic: {data.topic or 'general Islamic motivation'}\n"
        f"Tone: {data.tone}\n\n"
        "Include a relevant Quran verse or Hadith (with reference), a brief explanation, "
        "and a call to action encouraging sadaqah for Gaza. Keep it under 200 words."
    )
    text = _call_openai(prompt)
    ctx = data.model_dump(exclude_none=True)
    return _save_draft(db, admin, AiDraftType.reminder, text, ctx)


def generate_impact_update(db: Session, admin: User, data: AiImpactUpdateRequest) -> AiDraft:
    prompt = (
        "Write a heartfelt impact update for a Gaza humanitarian project.\n"
        f"Project: {data.project_title or 'Gaza Relief Project'}\n"
        f"Beneficiaries: {data.beneficiaries_count or 'families'}\n"
        f"Location: {data.location or 'Gaza'}\n"
        f"Additional context: {data.extra_context or ''}\n\n"
        "Write in a grateful, faith-centred tone thanking donors and showing real impact. "
        "Under 200 words."
    )
    text = _call_openai(prompt)
    ctx = data.model_dump(exclude_none=True)
    return _save_draft(db, admin, AiDraftType.impact_update, text, ctx)


def generate_weekly_summary(db: Session, admin: User, data: AiWeeklySummaryRequest) -> AiDraft:
    prompt = (
        "Write a weekly summary message for Family Pledge Gaza relief donors.\n"
        f"Week starting: {data.week_start or 'this week'}\n"
        f"Total contributions: {data.total_contributions or 0}\n"
        f"Total amount raised: ${data.total_amount or 0:.2f}\n"
        f"Additional context: {data.extra_context or ''}\n\n"
        "Celebrate donor generosity, mention impact, include an Islamic encouragement "
        "for continued giving. Under 200 words."
    )
    text = _call_openai(prompt)
    ctx = data.model_dump(exclude_none=True)
    return _save_draft(db, admin, AiDraftType.weekly_summary, text, ctx)


def generate_collector_message(
    db: Session, admin: User, data: AiCollectorMessageRequest
) -> AiDraft:
    prompt = (
        "Write a motivational message for a collector (fundraising circle leader) "
        "on the Family Pledge Gaza relief platform.\n"
        f"Collector name: {data.collector_name or 'Dear Collector'}\n"
        f"Group name: {data.group_name or 'your circle'}\n"
        f"Pending donors this month: {data.pending_count or 0}\n"
        f"Additional context: {data.extra_context or ''}\n\n"
        "Encourage them to follow up with pending donors gently and Islamically. "
        "Under 150 words."
    )
    text = _call_openai(prompt)
    ctx = data.model_dump(exclude_none=True)
    return _save_draft(db, admin, AiDraftType.collector_message, text, ctx)


def list_drafts(
    db: Session, admin: User, skip: int = 0, limit: int = 20
) -> Tuple[List[AiDraft], int]:
    base = select(AiDraft).where(AiDraft.admin_id == admin.id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(base.order_by(AiDraft.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def _get_draft(db: Session, draft_id: UUID, admin: User) -> AiDraft:
    draft = db.scalar(
        select(AiDraft).where(AiDraft.id == draft_id, AiDraft.admin_id == admin.id)
    )
    if not draft:
        raise HTTPException(404, "Draft not found")
    return draft


def approve_draft(db: Session, admin: User, draft_id: UUID) -> AiDraft:
    draft = _get_draft(db, draft_id, admin)
    if draft.status != AiDraftStatus.draft:
        raise HTTPException(400, "Only draft-status items can be approved")
    draft.status = AiDraftStatus.approved
    draft.approved_by = admin.id
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_draft.approve",
            entity_type="ai_draft",
            entity_id=str(draft_id),
            metadata_={},
        )
    )
    db.commit()
    db.refresh(draft)
    return draft


def reject_draft(db: Session, admin: User, draft_id: UUID) -> AiDraft:
    draft = _get_draft(db, draft_id, admin)
    if draft.status not in (AiDraftStatus.draft, AiDraftStatus.approved):
        raise HTTPException(400, "Draft cannot be rejected in its current state")
    draft.status = AiDraftStatus.rejected
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_draft.reject",
            entity_type="ai_draft",
            entity_id=str(draft_id),
            metadata_={},
        )
    )
    db.commit()
    db.refresh(draft)
    return draft
