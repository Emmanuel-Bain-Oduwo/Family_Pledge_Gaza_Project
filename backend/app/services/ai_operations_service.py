from datetime import datetime, timedelta, timezone
from uuid import UUID
import json
import logging

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_operations import AiFollowupSuggestion, AiGeneratedContent, AiTask, AiTaskRun
from app.models.audit import AdminAuditLog
from app.models.campaign import Campaign
from app.models.contribution import Contribution
from app.models.enums import (
    AiContentStatus,
    AiFollowupStatus,
    AiPriority,
    AiTaskRunStatus,
    AiTaskStatus,
    CampaignStatus,
    ContributionStatus,
    PledgeStatus,
    UserRole,
)
from app.models.pledge import Pledge
from app.models.user import User

log = logging.getLogger(__name__)

AI_OPERATIONS_SYSTEM_PROMPT = """You are the Family Pledge AI Operations Assistant.
You may generate suggested wording only. You must not send notifications, approve
or reject contributions, delete donors, change campaign data, or directly modify
critical database records. Return concise JSON with title and body."""


def _audit(db: Session, admin: User, action: str, entity_type: str, entity_id=None, metadata=None) -> None:
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            metadata_=metadata or {},
        )
    )


def _fallback_content(prompt: str, content_type: str, channel: str) -> dict[str, str]:
    title = f"Draft {content_type.replace('_', ' ').title()}"
    body = (
        "Assalamu alaikum. This is an AI suggestion — requires admin approval. "
        f"Based on your request for {channel}: {prompt.strip()} "
        "Please review, edit, and approve before sending. Not sent yet."
    )
    return {"title": title[:255], "body": body}


def _generate_content_json(prompt: str, content_type: str, channel: str) -> dict[str, str]:
    if not settings.OPENAI_API_KEY:
        return _fallback_content(prompt, content_type, channel)

    try:
        from app.services.ai_service import _call_openai

        raw = _call_openai(
            "\n".join(
                [
                    AI_OPERATIONS_SYSTEM_PROMPT,
                    f"Content type: {content_type}",
                    f"Channel: {channel}",
                    f"Admin request: {prompt}",
                    "Return JSON only with keys: title, body. Do not include invented stats or private donor data.",
                ]
            ),
            draft_type="reminder",
            json_mode=True,
        )
        parsed = json.loads(raw)
        title = str(parsed.get("title") or f"Draft {content_type.title()}")[:255]
        body = str(parsed.get("body") or "").strip()
        if not body:
            return _fallback_content(prompt, content_type, channel)
        return {"title": title, "body": body}
    except Exception as exc:  # provider failure must not break admin workflow
        log.warning("AI operations content generation fell back to template: %s", exc)
        return _fallback_content(prompt, content_type, channel)


def generate_content_draft(db: Session, admin: User, prompt: str, content_type: str, channel: str) -> AiGeneratedContent:
    generated = _generate_content_json(prompt, content_type, channel)
    content = AiGeneratedContent(
        created_by_admin_id=admin.id,
        content_type=content_type,
        channel=channel,
        title=generated["title"],
        body=generated["body"],
        status=AiContentStatus.pending_approval,
    )
    db.add(content)
    db.flush()
    _audit(db, admin, "ai_content.generate", "ai_generated_content", content.id, {"content_type": content_type, "channel": channel})
    db.commit()
    db.refresh(content)
    return content


def _donor_name(user: User | None) -> str:
    if not user:
        return "Donor"
    return user.full_name or user.nickname or user.public_display_name or "Donor"


def find_followup_suggestions(db: Session) -> list[dict]:
    """Read-only follow-up detection. Does not create or update suggestion rows."""
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    items: list[dict] = []

    pledges = db.scalars(select(Pledge).where(Pledge.status == PledgeStatus.active)).all()
    for pledge in pledges:
        has_contribution = db.scalar(
            select(Contribution.id)
            .where(Contribution.pledge_id == pledge.id, Contribution.contribution_month == current_month)
            .limit(1)
        )
        if has_contribution:
            continue
        name = _donor_name(pledge.user)
        items.append(
            {
                "type": "monthly_pledge_missing_contribution",
                "user_id": pledge.user_id,
                "donor_name": name,
                "reason": f"Active pledge has no contribution submitted for {current_month}.",
                "recommended_action": "Admin can review and send a gentle monthly pledge reminder.",
                "suggested_message": f"Assalamu alaikum {name}, this is a gentle reminder about your {current_month} family pledge. May Allah reward your support.",
                "priority": AiPriority.medium,
                "related_contribution_id": None,
                "related_pledge_id": pledge.id,
            }
        )

    review_statuses = [ContributionStatus.submitted, ContributionStatus.needs_follow_up, ContributionStatus.rejected]
    for contribution in db.scalars(select(Contribution).where(Contribution.status.in_(review_statuses))).all():
        name = _donor_name(contribution.user)
        if contribution.status == ContributionStatus.submitted:
            items.append(
                {
                    "type": "contribution_waiting_review",
                    "user_id": contribution.user_id,
                    "donor_name": name,
                    "reason": "Contribution was submitted and is waiting for admin review.",
                    "recommended_action": "Admin should review proof and then decide the contribution status.",
                    "suggested_message": f"Assalamu alaikum {name}, thank you for submitting your contribution. Our admin team is reviewing it and will update you soon.",
                    "priority": AiPriority.high,
                    "related_contribution_id": contribution.id,
                    "related_pledge_id": contribution.pledge_id,
                }
            )
        elif contribution.status == ContributionStatus.needs_follow_up:
            items.append(
                {
                    "type": "contribution_needs_follow_up",
                    "user_id": contribution.user_id,
                    "donor_name": name,
                    "reason": "Contribution is marked needs_follow_up.",
                    "recommended_action": "Admin can contact donor for missing or unclear contribution details.",
                    "suggested_message": f"Assalamu alaikum {name}, thank you for your support. Could you please help us verify the contribution details so we can complete the review?",
                    "priority": AiPriority.urgent,
                    "related_contribution_id": contribution.id,
                    "related_pledge_id": contribution.pledge_id,
                }
            )
        else:
            items.append(
                {
                    "type": "contribution_rejected_follow_up",
                    "user_id": contribution.user_id,
                    "donor_name": name,
                    "reason": "Contribution was rejected and may need a donor-friendly follow-up.",
                    "recommended_action": "Admin can explain what needs correction and invite resubmission if appropriate.",
                    "suggested_message": f"Assalamu alaikum {name}, thank you for your support. We could not complete the review for your contribution. Please check the details or contact the admin team for help.",
                    "priority": AiPriority.high,
                    "related_contribution_id": contribution.id,
                    "related_pledge_id": contribution.pledge_id,
                }
            )

    donors = db.scalars(select(User).where(User.role == UserRole.donor, User.is_active.is_(True))).all()
    for donor in donors:
        latest_activity = db.scalar(
            select(func.max(Contribution.created_at)).where(Contribution.user_id == donor.id)
        )
        if latest_activity is None:
            latest_activity = donor.updated_at or donor.created_at
        if latest_activity and latest_activity < cutoff:
            name = _donor_name(donor)
            items.append(
                {
                    "type": "inactive_donor_30_days",
                    "user_id": donor.id,
                    "donor_name": name,
                    "reason": "Donor has no detected activity for 30+ days based on available timestamps.",
                    "recommended_action": "Admin can send a warm check-in or monthly reminder after review.",
                    "suggested_message": f"Assalamu alaikum {name}, we hope you are well. This is a gentle check-in from Family Pledge. May Allah reward every intention and support.",
                    "priority": AiPriority.low,
                    "related_contribution_id": None,
                    "related_pledge_id": None,
                }
            )

    for campaign in db.scalars(select(Campaign).where(Campaign.status == CampaignStatus.active)).all():
        progress = None
        if campaign.target_amount:
            progress = round(float(campaign.raised_amount or 0) / float(campaign.target_amount) * 100, 1)
        items.append(
            {
                "type": "campaign_progress_summary",
                "user_id": None,
                "donor_name": None,
                "reason": f"Active campaign '{campaign.title}' can be summarized for admins." + (f" Progress is {progress}%." if progress is not None else ""),
                "recommended_action": "Prepare campaign progress summary for admin review.",
                "suggested_message": f"Campaign update: {campaign.title} is active. Review latest progress and consider an admin-approved update for donors.",
                "priority": AiPriority.low,
                "related_contribution_id": None,
                "related_pledge_id": None,
            }
        )
    return items


def view_followup_suggestions(db: Session, admin: User) -> list[dict]:
    items = find_followup_suggestions(db)
    _audit(db, admin, "ai_followups.view", "ai_followup_suggestion", None, {"count": len(items)})
    db.commit()
    return items


def create_ai_task(db: Session, admin: User, data) -> AiTask:
    task = AiTask(created_by_admin_id=admin.id, **data.model_dump())
    db.add(task)
    db.flush()
    _audit(db, admin, "ai_task.create", "ai_task", task.id, {"task_type": task.task_type.value})
    db.commit()
    db.refresh(task)
    return task


def validate_ai_task(task: AiTask) -> dict:
    allowed = task.requires_approval is True and task.status != AiTaskStatus.cancelled
    return {"valid": allowed, "requires_approval": task.requires_approval, "phase_1_suggest_only": True}


def run_ai_task_once(db: Session, admin: User, task: AiTask) -> AiTaskRun:
    validation = validate_ai_task(task)
    run = AiTaskRun(
        task_id=task.id,
        status=AiTaskRunStatus.waiting_approval if validation["valid"] else AiTaskRunStatus.failed,
        planned_action={"instruction": task.instruction, "task_type": task.task_type.value},
        generated_output={"message": "Draft task run created. Not sent yet."},
        validation_result=validation,
        executed_at=datetime.now(timezone.utc),
        error_message=None if validation["valid"] else "Task is unsafe or does not require approval.",
    )
    task.last_run_at = run.executed_at
    db.add(run)
    _audit(db, admin, "ai_task.run_now", "ai_task", task.id, validation)
    db.commit()
    db.refresh(run)
    return run


def approve_generated_content(db: Session, admin: User, content_id: UUID):
    content = db.get(AiGeneratedContent, content_id)
    if not content:
        raise HTTPException(404, "AI content not found")
    content.status = AiContentStatus.approved
    content.approved_by = admin.id
    content.approved_at = datetime.now(timezone.utc)
    _audit(db, admin, "ai_content.approve", "ai_generated_content", content.id)
    db.commit()
    db.refresh(content)
    return content


def reject_generated_content(db: Session, admin: User, content_id: UUID):
    content = db.get(AiGeneratedContent, content_id)
    if not content:
        raise HTTPException(404, "AI content not found")
    content.status = AiContentStatus.rejected
    _audit(db, admin, "ai_content.reject", "ai_generated_content", content.id)
    db.commit()
    db.refresh(content)
    return content


def approve_followup_suggestion(db: Session, admin: User, suggestion_id: UUID):
    s = db.get(AiFollowupSuggestion, suggestion_id)
    if not s:
        raise HTTPException(404, "AI follow-up suggestion not found")
    s.status = AiFollowupStatus.approved
    s.approved_by = admin.id
    s.approved_at = datetime.now(timezone.utc)
    _audit(db, admin, "ai_followup.approve", "ai_followup_suggestion", s.id)
    db.commit()
    db.refresh(s)
    return s


def dismiss_followup_suggestion(db: Session, admin: User, suggestion_id: UUID):
    s = db.get(AiFollowupSuggestion, suggestion_id)
    if not s:
        raise HTTPException(404, "AI follow-up suggestion not found")
    s.status = AiFollowupStatus.dismissed
    _audit(db, admin, "ai_followup.dismiss", "ai_followup_suggestion", s.id)
    db.commit()
    db.refresh(s)
    return s
