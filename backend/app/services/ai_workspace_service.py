import json
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.collector import Collector
from app.models.contribution import Contribution
from app.models.enums import (
    CampaignStatus,
    ContributionStatus,
    PledgeStatus,
    ReminderStatus,
    UserRole,
)
from app.models.pledge import Pledge
from app.models.reminder import DailyReminder
from app.models.user import User
from app.services.ai_provider_service import call_ai

AI_ADMIN_SYSTEM_PROMPT = """You are the internal Family Pledge Admin AI Assistant.
Your allowed scope is ONLY:
1) Family Pledge/NAMLEF operations and Gaza/Palestine humanitarian donation work;
2) Islamic reminders, charity ethics, duas and general Islamic context relevant to that work;
3) facts contained in the read-only Family Pledge database context supplied to you.

Rules:
- Database context below is authoritative. Never change a number or invent missing facts.
- Never reveal or request private donor identity, phone, email, payment reference, screenshot, password, token or other sensitive personal data.
- If asked who an individual donor is or for personal donor details, refuse that part and offer aggregate information.
- You have NO direct SQL/database access. You only see sanitized context selected by the backend.
- Do not claim you sent, published, approved, deleted, confirmed or changed anything. You cannot execute those actions.
- Do not issue fatwas. Do not fabricate Quran verses, hadith, Arabic text, translations, source references or religious rulings.
- For exact Quran/hadith wording or citation, use only an approved reminder/source explicitly present in the supplied context; otherwise say the exact source should be verified by an approved human source.
- Keep donor-facing language non-manipulative: no guilt, coercion or guaranteed religious reward claims.
- If the request is unrelated to Family Pledge, Gaza humanitarian donations, Islam in this context, or the supplied operational data, say it is outside the Family Pledge AI workspace scope.
"""

_DOMAIN_SCOPE_TERMS = {
    "family pledge", "namlef", "gaza", "palestine", "humanitarian", "donation",
    "donor", "pledge", "contribution", "campaign", "collector", "impact",
    "fundraising", "charity", "sadaqah", "zakat", "islam", "islamic", "muslim",
    "allah", "quran", "qur'an", "hadith", "dua", "jumu", "relief", "beneficiar",
    "orphans", "widows",
}

_PLATFORM_SCOPE_TERMS = {
    "dashboard", "database", "accounting", "payment", "notification", "reminder",
    "pending", "confirmed", "rejected", "raised", "progress", "collector",
    "contribution", "pledge", "campaign", "donor",
}

_PLATFORM_CONTEXT_TERMS = {
    "admin", "platform", "family pledge", "namlef", "database", "dashboard",
    "operations", "accounting", "stats", "statistics",
}


def is_in_scope(text: str) -> bool:
    normalized = " ".join(text.lower().split())
    if any(term in normalized for term in _DOMAIN_SCOPE_TERMS):
        return True
    # Generic words such as report/task/summary are never sufficient by themselves.
    # A platform-operational request needs both an operational object and explicit
    # Family Pledge/admin/database context.
    return (
        any(term in normalized for term in _PLATFORM_SCOPE_TERMS)
        and any(term in normalized for term in _PLATFORM_CONTEXT_TERMS)
    )


def _number(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def platform_summary(db: Session) -> dict:
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    return {
        "month": month,
        "active_donors": int(db.scalar(select(func.count(User.id)).where(
            User.role == UserRole.donor,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )) or 0),
        "active_pledges": int(db.scalar(select(func.count(Pledge.id)).where(
            Pledge.status == PledgeStatus.active
        )) or 0),
        "pending_contributions": int(db.scalar(select(func.count(Contribution.id)).where(
            Contribution.status.in_([
                ContributionStatus.submitted,
                ContributionStatus.needs_follow_up,
            ])
        )) or 0),
        "confirmed_contributions_this_month": int(db.scalar(select(func.count(Contribution.id)).where(
            Contribution.status == ContributionStatus.confirmed,
            Contribution.contribution_month == month,
        )) or 0),
        "active_campaigns": int(db.scalar(select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.active,
            Campaign.deleted_at.is_(None),
        )) or 0),
        "collectors": int(db.scalar(select(func.count(Collector.id))) or 0),
    }


def contribution_summary(db: Session) -> dict:
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    status_rows = db.execute(
        select(Contribution.status, func.count(Contribution.id))
        .where(Contribution.contribution_month == month)
        .group_by(Contribution.status)
    ).all()
    currency_rows = db.execute(
        select(Contribution.currency, func.coalesce(func.sum(Contribution.amount), 0))
        .where(
            Contribution.contribution_month == month,
            Contribution.status == ContributionStatus.confirmed,
        )
        .group_by(Contribution.currency)
    ).all()
    return {
        "month": month,
        "counts_by_status": {
            (status.value if hasattr(status, "value") else str(status)): int(count)
            for status, count in status_rows
        },
        "confirmed_amounts_by_currency": {
            currency: _number(total) for currency, total in currency_rows
        },
        "privacy_note": "Aggregate accounting data only; no donor identities or payment proof details supplied to AI.",
    }


def campaign_summary(db: Session) -> list[dict]:
    campaigns = list(db.scalars(
        select(Campaign)
        .where(Campaign.deleted_at.is_(None), Campaign.status == CampaignStatus.active)
        .order_by(Campaign.created_at.desc())
        .limit(10)
    ).all())
    return [
        {
            "title": campaign.title,
            "type": campaign.campaign_type.value,
            "status": campaign.status.value,
            "target_amount": _number(campaign.target_amount),
            "raised_amount": _number(campaign.raised_amount),
            "donor_target": campaign.donor_target,
            "donor_count": campaign.donor_count,
            "starts_at": campaign.starts_at.isoformat() if campaign.starts_at else None,
            "ends_at": campaign.ends_at.isoformat() if campaign.ends_at else None,
        }
        for campaign in campaigns
    ]


def approved_religious_context(db: Session) -> list[dict]:
    reminders = list(db.scalars(
        select(DailyReminder)
        .where(DailyReminder.status.in_([ReminderStatus.approved, ReminderStatus.published]))
        .order_by(DailyReminder.created_at.desc())
        .limit(6)
    ).all())
    return [
        {
            "title": item.title,
            "type": item.reminder_type.value,
            "arabic_text": item.arabic_text,
            "translation": item.translation,
            "explanation": item.explanation,
            "source_reference": item.source_reference,
            "status": item.status.value,
        }
        for item in reminders
    ]


def select_context(db: Session, question: str) -> list[dict]:
    q = question.lower()
    blocks: list[dict] = []

    operational_terms = (
        "dashboard", "database", "stats", "statistics", "status", "today", "week",
        "report", "summary", "task", "operations", "pending", "action", "total",
    )
    if any(term in q for term in operational_terms):
        blocks.append({
            "name": "platform_summary",
            "description": "Sanitized aggregate Family Pledge operating metrics.",
            "data": platform_summary(db),
        })

    if any(term in q for term in ("contribution", "donation", "payment", "amount", "confirmed", "pending", "pledge")):
        blocks.append({
            "name": "contribution_summary",
            "description": "Current-month aggregate contribution accounting without donor identity or proof data.",
            "data": contribution_summary(db),
        })

    if any(term in q for term in ("campaign", "raised", "fundraising", "impact", "appeal", "progress")):
        blocks.append({
            "name": "active_campaigns",
            "description": "Current active campaign facts from PostgreSQL.",
            "data": campaign_summary(db),
        })

    if any(term in q for term in ("quran", "qur'an", "hadith", "islam", "islamic", "dua", "sadaqah", "zakat", "jumu", "friday", "allah")):
        blocks.append({
            "name": "approved_religious_reminders",
            "description": "Recent admin-approved/published religious reminder content and source references.",
            "data": approved_religious_context(db),
        })

    if not blocks:
        blocks.append({
            "name": "platform_summary",
            "description": "Sanitized aggregate Family Pledge operating metrics.",
            "data": platform_summary(db),
        })
    return blocks


def answer_admin_question(
    db: Session,
    message: str,
    history: list[dict] | None = None,
) -> dict:
    if not is_in_scope(message):
        raise HTTPException(
            400,
            "This AI workspace is limited to Family Pledge/NAMLEF operations, Gaza humanitarian donations, relevant Islamic context, and approved read-only platform facts.",
        )

    blocks = select_context(db, message)
    safe_history = (history or [])[-8:]
    history_text = "\n".join(
        f"{item.get('role', 'user').title()}: {str(item.get('content', ''))[:1200]}"
        for item in safe_history
    )
    prompt = (
        f"Admin question:\n{message}\n\n"
        + (f"Recent conversation:\n{history_text}\n\n" if history_text else "")
        + "Read-only backend context (JSON):\n"
        + json.dumps(blocks, default=str, ensure_ascii=False)
        + "\n\nAnswer the admin directly. Clearly distinguish database facts from general guidance. "
          "If the requested database fact is not in the supplied context, say it is not available from the approved tools rather than guessing."
    )
    answer = call_ai(
        system_prompt=AI_ADMIN_SYSTEM_PROMPT,
        user_prompt=prompt,
        max_tokens=1000,
        temperature=0.3,
    )
    return {
        "answer": answer,
        "context_used": blocks,
        "scope": "family_pledge_admin",
        "actions_executed": [],
    }
