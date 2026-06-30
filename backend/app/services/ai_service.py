"""
AI Assistant service — drafts only, never publishes autonomously.

Guardrails enforced by system prompt:
  - No invented stats, amounts, or beneficiary numbers
  - No fabricated Quran verses, hadiths, or fatwa-style rulings
  - All outputs saved as drafts; require human approval before any use
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_draft import AiDraft
from app.models.audit import AdminAuditLog
from app.models.campaign import Campaign
from app.models.collector import Collector, CollectorMember
from app.models.contribution import Contribution
from app.models.enums import (
    AiDraftStatus,
    AiDraftType,
    CampaignStatus,
    ContributionStatus,
    PledgeStatus,
    UserRole,
)
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.ai_draft import (
    AiCollectorMessageRequest,
    AiImpactUpdateRequest,
    AiReminderRequest,
    AiWeeklySummaryRequest,
)

log = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are the Family Pledge Admin Assistant, helping the Family Pledge team "
    "draft humanitarian donor communications.\n\n"
    "Rules:\n"
    "- Do not invent donation amounts, beneficiary numbers, project results, or claims.\n"
    "- Use only facts provided by the admin or retrieved from the database.\n"
    "- Keep the tone warm, respectful, Islamic, humanitarian, and non-manipulative.\n"
    "- Do not issue fatwas or religious rulings.\n"
    "- Do not fabricate Quran verses, hadiths, sources, or translations.\n"
    "- If Quran or hadith content is requested, only format and explain content "
    "supplied by an admin-approved source.\n"
    "- Do not mention sensitive personal donor data.\n"
    "- Do not pressure, shame, or guilt donors.\n"
    "- Always produce a draft for human approval before public use."
)

# Max tokens per draft type to control cost
_MAX_TOKENS: Dict[str, int] = {
    "reminder": 350,
    "impact_update": 600,
    "weekly_summary": 500,
    "collector_message": 300,
}


def _get_openai_client():
    """Return an OpenAI client; raise 503 if key not configured."""
    try:
        from openai import OpenAI
    except ImportError:
        raise HTTPException(503, "openai package not installed")
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            503,
            "OPENAI_API_KEY is not configured. Set it in your environment to enable AI features.",
        )
    return OpenAI(api_key=settings.OPENAI_API_KEY, timeout=30.0)


def _call_openai(
    prompt: str,
    *,
    draft_type: str = "reminder",
    json_mode: bool = False,
) -> str:
    """
    Call OpenAI chat completions with the Family Pledge system prompt.
    Returns the model's text (or JSON string when json_mode=True).
    """
    try:
        from openai import APITimeoutError, AuthenticationError, RateLimitError
    except ImportError:
        raise HTTPException(503, "openai package not installed")

    client = _get_openai_client()
    max_tokens = _MAX_TOKENS.get(draft_type, 400)

    kwargs: Dict[str, Any] = {
        "model": settings.OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.65,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content.strip()
    except AuthenticationError:
        log.error("OpenAI authentication failed — check OPENAI_API_KEY")
        raise HTTPException(502, "OpenAI authentication failed. Check OPENAI_API_KEY.")
    except RateLimitError:
        log.warning("OpenAI rate limit hit")
        raise HTTPException(429, "AI service is busy. Please try again in a moment.")
    except APITimeoutError:
        log.warning("OpenAI request timed out")
        raise HTTPException(504, "AI service timed out. Please try again.")
    except Exception as exc:
        log.error("OpenAI call failed: %s", exc)
        raise HTTPException(502, f"AI generation failed: {exc}")


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
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_draft.create",
            entity_type="ai_draft",
            entity_id=None,
            metadata_={"draft_type": draft_type.value},
        )
    )
    db.commit()
    db.refresh(draft)
    return draft


# ── Generators ────────────────────────────────────────────────────────────────

def generate_reminder(db: Session, admin: User, data: AiReminderRequest) -> AiDraft:
    key_points_text = "\n".join(f"- {p}" for p in data.key_points) if data.key_points else ""
    prompt_parts = [
        f"Write an Islamic donor reminder for Family Pledge Gaza relief.",
        f"Audience: {data.audience}",
        f"Tone: {data.tone}",
        f"Language: {data.language}",
    ]
    if data.campaign_title:
        prompt_parts.append(f"Campaign: {data.campaign_title}")
    if data.campaign_goal:
        prompt_parts.append(f"Campaign goal: {data.campaign_goal}")
    if data.donor_progress:
        prompt_parts.append(f"Donor progress context: {data.donor_progress}")
    if key_points_text:
        prompt_parts.append(f"Key points to include:\n{key_points_text}")
    max_words = data.max_length or 200
    prompt_parts.append(
        f"\nWrite a warm, respectful reminder. "
        f"Do NOT invent donation amounts, statistics, or Quran verses. "
        f"Keep it under {max_words} words. Output plain text only."
    )
    text = _call_openai("\n".join(prompt_parts), draft_type="reminder")
    return _save_draft(db, admin, AiDraftType.reminder, text, data.model_dump(exclude_none=True))


def generate_impact_update(db: Session, admin: User, data: AiImpactUpdateRequest) -> AiDraft:
    facts_text = "\n".join(f"- {f}" for f in data.verified_facts) if data.verified_facts else ""
    prompt_parts = [
        "Write a humanitarian impact update for Family Pledge Gaza relief.",
        f"Project title: {data.project_title}",
        f"Tone: {data.tone}",
        f"Language: {data.language}",
    ]
    if data.category:
        prompt_parts.append(f"Category: {data.category}")
    if data.beneficiaries_count is not None:
        prompt_parts.append(f"Beneficiaries reached: {data.beneficiaries_count}")
    if data.completed_date:
        prompt_parts.append(f"Completion date: {data.completed_date}")
    if facts_text:
        prompt_parts.append(f"Verified facts (use only these, do not add others):\n{facts_text}")
    if data.call_to_action:
        prompt_parts.append(f"Call to action: {data.call_to_action}")

    prompt_parts.append(
        "\nReturn a JSON object with exactly these three keys:\n"
        '  "app_update": a 2-3 paragraph in-app impact update (150 words max)\n'
        '  "whatsapp_message": a short WhatsApp-friendly message with emojis (100 words max)\n'
        '  "push_notification": a push notification body (30 words max)\n'
        "Do NOT invent any figures beyond those supplied above."
    )
    raw = _call_openai("\n".join(prompt_parts), draft_type="impact_update", json_mode=True)

    try:
        parsed = json.loads(raw)
        app_update = parsed.get("app_update", "")
        whatsapp = parsed.get("whatsapp_message", "")
        push = parsed.get("push_notification", "")
    except (json.JSONDecodeError, KeyError):
        app_update = whatsapp = push = ""
        raw = raw  # keep as-is

    combined = (
        f"=== App Update ===\n{app_update}\n\n"
        f"=== WhatsApp Message ===\n{whatsapp}\n\n"
        f"=== Push Notification ===\n{push}"
    ).strip()

    ctx = data.model_dump(exclude_none=True)
    ctx["_output"] = {"app_update": app_update, "whatsapp_message": whatsapp, "push_notification": push}
    return _save_draft(db, admin, AiDraftType.impact_update, combined, ctx)


def generate_weekly_summary(db: Session, admin: User, data: AiWeeklySummaryRequest) -> AiDraft:
    # Collect aggregated stats from DB — send only counts, never personal data
    total_donors = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.donor, User.deleted_at.is_(None)
        )
    ) or 0
    active_pledges = db.scalar(
        select(func.count(Pledge.id)).where(Pledge.status == PledgeStatus.active)
    ) or 0
    confirmed_this_month = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.status == ContributionStatus.confirmed,
            Contribution.contribution_month == _current_month(),
        )
    ) or 0
    pending_contributions = db.scalar(
        select(func.count(Contribution.id)).where(
            Contribution.status == ContributionStatus.submitted
        )
    ) or 0
    active_campaigns = db.scalar(
        select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.active,
            Campaign.deleted_at.is_(None),
        )
    ) or 0
    collectors_count = db.scalar(select(func.count(Collector.id))) or 0

    stats = {
        "total_donors": total_donors,
        "active_pledges": active_pledges,
        "confirmed_contributions_this_month": confirmed_this_month,
        "pending_contributions": pending_contributions,
        "active_campaigns": active_campaigns,
        "collectors": collectors_count,
    }

    date_label = data.date_range or "this week"
    prompt = (
        f"Generate an internal weekly summary for the Family Pledge admin team covering {date_label}.\n\n"
        "Live platform stats (do not alter these numbers):\n"
        + "\n".join(f"- {k.replace('_', ' ').title()}: {v}" for k, v in stats.items())
        + "\n\nReturn a JSON object with exactly two keys:\n"
        '  "summary": a concise narrative summary for the admin team (150 words max)\n'
        '  "suggested_actions": a list of 3-5 short actionable suggestions based on the stats\n'
        "Do not invent figures beyond those provided."
    )

    raw = _call_openai(prompt, draft_type="weekly_summary", json_mode=True)

    try:
        parsed = json.loads(raw)
        summary_text = parsed.get("summary", "")
        actions = parsed.get("suggested_actions", [])
        if isinstance(actions, list):
            actions_text = "\n".join(f"- {a}" for a in actions)
        else:
            actions_text = str(actions)
    except (json.JSONDecodeError, KeyError):
        summary_text = raw
        actions_text = ""

    combined = f"=== Summary ===\n{summary_text}"
    if actions_text:
        combined += f"\n\n=== Suggested Actions ===\n{actions_text}"

    ctx: Dict[str, Any] = {"date_range": date_label, "stats_snapshot": stats}
    return _save_draft(db, admin, AiDraftType.weekly_summary, combined, ctx)


def generate_collector_message(
    db: Session, admin: User, data: AiCollectorMessageRequest
) -> AiDraft:
    prompt_parts = [
        "Write a motivational message for a fundraising circle collector on Family Pledge Gaza relief.",
        f"Tone: {data.tone}",
        f"Language: {data.language}",
        f"Group name: {data.group_name}",
    ]
    if data.collector_name:
        prompt_parts.append(f"Collector name: {data.collector_name}")
    if data.campaign_title:
        prompt_parts.append(f"Campaign: {data.campaign_title}")
    if data.registered_count is not None:
        prompt_parts.append(f"Total circle members: {data.registered_count}")
    if data.contributed_count is not None:
        prompt_parts.append(f"Members who have contributed: {data.contributed_count}")
    if data.pending_count is not None:
        prompt_parts.append(f"Members still pending: {data.pending_count}")
    prompt_parts.append(
        "\nWrite a warm, non-pressuring message encouraging them to gently follow up "
        "with pending members. Under 150 words. Plain text only."
    )
    text = _call_openai("\n".join(prompt_parts), draft_type="collector_message")
    return _save_draft(db, admin, AiDraftType.collector_message, text, data.model_dump(exclude_none=True))


# ── Draft management ──────────────────────────────────────────────────────────

def list_drafts(
    db: Session,
    admin: User,
    skip: int = 0,
    limit: int = 20,
    draft_type: Optional[str] = None,
    status: Optional[str] = None,
) -> Tuple[List[AiDraft], int]:
    q = select(AiDraft)
    if draft_type:
        try:
            q = q.where(AiDraft.draft_type == AiDraftType(draft_type))
        except ValueError:
            pass
    if status:
        try:
            q = q.where(AiDraft.status == AiDraftStatus(status))
        except ValueError:
            pass
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    items = list(
        db.scalars(q.order_by(AiDraft.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def _get_draft(db: Session, draft_id: UUID) -> AiDraft:
    draft = db.scalar(select(AiDraft).where(AiDraft.id == draft_id))
    if not draft:
        raise HTTPException(404, "Draft not found")
    return draft


def approve_draft(db: Session, admin: User, draft_id: UUID) -> AiDraft:
    draft = _get_draft(db, draft_id)
    if draft.status != AiDraftStatus.draft:
        raise HTTPException(400, "Only drafts with status 'draft' can be approved")
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
    draft = _get_draft(db, draft_id)
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


def publish_draft(db: Session, admin: User, draft_id: UUID) -> AiDraft:
    """
    Mark a draft as published/ready-to-use.
    Does NOT automatically send anything — publishing is a human decision gate.
    """
    draft = _get_draft(db, draft_id)
    if draft.status != AiDraftStatus.approved:
        raise HTTPException(
            400,
            "Only approved drafts can be published. Approve the draft first.",
        )
    draft.status = AiDraftStatus.published
    draft.published_at = datetime.now(timezone.utc)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="ai_draft.publish",
            entity_type="ai_draft",
            entity_id=str(draft_id),
            metadata_={},
        )
    )
    db.commit()
    db.refresh(draft)
    return draft


# ── Helpers ───────────────────────────────────────────────────────────────────

def _current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")
