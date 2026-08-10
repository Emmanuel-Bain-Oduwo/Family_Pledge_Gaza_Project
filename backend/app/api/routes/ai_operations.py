from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.ai_operations import AiFollowupSuggestion, AiGeneratedContent, AiTask, AiTaskRun
from app.models.enums import AiContentStatus, AiFollowupStatus, AiTaskRunStatus, AiTaskStatus
from app.models.user import User
from app.schemas.ai_operations import (
    AiContentDraftCreate,
    AiFollowupSuggestionOut,
    AiGeneratedContentOut,
    AiSummaryOut,
    AiTaskCreate,
    AiTaskOut,
    AiTaskRunOut,
    AiTaskUpdate,
)
from app.services import ai_operations_content_service, ai_operations_service, ai_task_service, ai_workspace_service

router = APIRouter(prefix="/admin/ai", tags=["AI Operations Assistant"])
ALLOWED_SCHEDULES = (None, "once", "daily", "weekly", "monthly")


def _followup_out(s: AiFollowupSuggestion) -> AiFollowupSuggestionOut:
    donor = s.user.full_name or s.user.nickname or "Donor" if s.user else None
    return AiFollowupSuggestionOut(id=s.id, type=s.suggestion_type, user_id=s.user_id, donor_name=donor, reason=s.reason, recommended_action="Before any message is sent.", suggested_message=s.suggested_message, priority=s.priority, related_contribution_id=s.contribution_id, related_pledge_id=s.pledge_id, status=s.status)


def _validate_schedule(schedule_type: str | None, next_run_at: datetime | None) -> None:
    if schedule_type not in ALLOWED_SCHEDULES:
        raise HTTPException(400, "Schedule must be manual, once, daily, weekly, or monthly")
    if schedule_type in ("once", "daily", "weekly", "monthly") and next_run_at is None:
        raise HTTPException(400, "Choose the first date and time for this scheduled task")
    if next_run_at is not None:
        value = next_run_at if next_run_at.tzinfo else next_run_at.replace(tzinfo=timezone.utc)
        if value <= datetime.now(timezone.utc):
            raise HTTPException(400, "Scheduled task time must be in the future")


@router.get("/summary", response_model=AiSummaryOut)
def summary(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return AiSummaryOut(
        pending_content=db.scalar(select(func.count()).select_from(AiGeneratedContent).where(AiGeneratedContent.status == AiContentStatus.pending_approval)) or 0,
        pending_followups=db.scalar(select(func.count()).select_from(AiFollowupSuggestion).where(AiFollowupSuggestion.status == AiFollowupStatus.new)) or 0,
        active_tasks=db.scalar(select(func.count()).select_from(AiTask).where(AiTask.status == AiTaskStatus.active)) or 0,
        failed_task_runs=db.scalar(select(func.count()).select_from(AiTaskRun).where(AiTaskRun.status == AiTaskRunStatus.failed)) or 0,
    )


@router.post("/content/draft", response_model=AiGeneratedContentOut, status_code=201)
def draft_content(data: AiContentDraftCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return ai_operations_content_service.generate_content_draft(db, admin, data.prompt, data.content_type, data.channel)


@router.get("/content", response_model=list[AiGeneratedContentOut])
def list_content(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.scalars(select(AiGeneratedContent).order_by(AiGeneratedContent.created_at.desc())).all()


@router.post("/content/{content_id}/approve", response_model=AiGeneratedContentOut)
def approve_content(content_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return ai_operations_service.approve_generated_content(db, admin, content_id)


@router.post("/content/{content_id}/reject", response_model=AiGeneratedContentOut)
def reject_content(content_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return ai_operations_service.reject_generated_content(db, admin, content_id)


@router.get("/follow-ups", response_model=list[AiFollowupSuggestionOut])
def followups(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return ai_operations_service.view_followup_suggestions(db, admin)


@router.post("/follow-ups/{suggestion_id}/approve", response_model=AiFollowupSuggestionOut)
def approve_followup(suggestion_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return _followup_out(ai_operations_service.approve_followup_suggestion(db, admin, suggestion_id))


@router.post("/follow-ups/{suggestion_id}/dismiss", response_model=AiFollowupSuggestionOut)
def dismiss_followup(suggestion_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return _followup_out(ai_operations_service.dismiss_followup_suggestion(db, admin, suggestion_id))


@router.get("/tasks", response_model=list[AiTaskOut])
def list_tasks(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.scalars(select(AiTask).order_by(AiTask.created_at.desc())).all()


@router.post("/tasks", response_model=AiTaskOut, status_code=201)
def create_task(data: AiTaskCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if not data.requires_approval:
        raise HTTPException(400, "Family Pledge AI tasks must require admin approval")
    if not ai_workspace_service.is_in_scope(data.instruction):
        raise HTTPException(400, "AI tasks are limited to Family Pledge/NAMLEF operations, Gaza humanitarian donations, and relevant Islamic context.")
    _validate_schedule(data.schedule_type, data.next_run_at)
    task = ai_operations_service.create_ai_task(db, admin, data)
    # The older creation service historically calculated daily/weekly from 'now'.
    # Preserve the exact first run selected by the admin; recurrence is calculated
    # only after that run by ai_task_service.
    if data.next_run_at is not None and task.next_run_at != data.next_run_at:
        task.next_run_at = data.next_run_at
        db.add(task)
        db.commit()
        db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=AiTaskOut)
def update_task(task_id: UUID, data: AiTaskUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    task = db.get(AiTask, task_id)
    if not task:
        raise HTTPException(404, "AI task not found")
    changes = data.model_dump(exclude_unset=True)
    if "instruction" in changes and not ai_workspace_service.is_in_scope(changes["instruction"]):
        raise HTTPException(400, "Updated AI task instruction is outside the Family Pledge AI scope")
    if "requires_approval" in changes and not changes["requires_approval"]:
        raise HTTPException(400, "Family Pledge AI tasks must require admin approval")
    if "schedule_type" in changes or "next_run_at" in changes:
        _validate_schedule(changes.get("schedule_type", task.schedule_type), changes.get("next_run_at", task.next_run_at))
    return ai_task_service.update_task(db, admin, task, changes)


@router.post("/tasks/{task_id}/run-now", response_model=AiTaskRunOut)
def run_task(task_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    task = db.get(AiTask, task_id)
    if not task:
        raise HTTPException(404, "AI task not found")
    return ai_task_service.run_task_once(db, admin, task)


@router.get("/task-runs", response_model=list[AiTaskRunOut])
def list_task_runs(task_id: UUID | None = Query(default=None), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    query = select(AiTaskRun)
    if task_id:
        query = query.where(AiTaskRun.task_id == task_id)
    return db.scalars(query.order_by(AiTaskRun.created_at.desc()).limit(100)).all()


@router.post("/task-runs/{run_id}/retry", response_model=AiTaskRunOut)
def retry_task_run(run_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return ai_task_service.retry_run(db, admin, run_id)


@router.post("/task-runs/{run_id}/approve", response_model=AiTaskRunOut)
def approve_task_run(run_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return ai_task_service.approve_run(db, admin, run_id)


@router.post("/task-runs/{run_id}/dismiss", response_model=AiTaskRunOut)
def dismiss_task_run(run_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return ai_task_service.dismiss_run(db, admin, run_id)
