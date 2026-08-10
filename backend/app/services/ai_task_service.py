import calendar
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ai_operations import AiTask, AiTaskRun
from app.models.audit import AdminAuditLog
from app.models.enums import AiTaskRunStatus, AiTaskStatus
from app.models.user import User
from app.services import ai_workspace_service


def _add_month(value: datetime) -> datetime:
    year = value.year + (1 if value.month == 12 else 0)
    month = 1 if value.month == 12 else value.month + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def _next_run(task: AiTask, now: datetime) -> datetime | None:
    if task.status != AiTaskStatus.active:
        return None
    if task.schedule_type == "daily":
        return now + timedelta(days=1)
    if task.schedule_type == "weekly":
        return now + timedelta(days=7)
    if task.schedule_type == "monthly":
        return _add_month(now)
    # Manual and one-time schedules have no recurrence after the run.
    return None


def validate_task(task: AiTask) -> dict:
    scope_ok = ai_workspace_service.is_in_scope(task.instruction)
    approval_ok = task.requires_approval is True
    status_ok = task.status != AiTaskStatus.cancelled
    return {
        "valid": scope_ok and approval_ok and status_ok,
        "scope_ok": scope_ok,
        "requires_approval": task.requires_approval,
        "status_allows_run": status_ok,
        "phase": "generate_reviewable_output_only",
    }


def run_task_once(db: Session, admin: User, task: AiTask) -> AiTaskRun:
    """Execute one AI preparation pass without performing any external action."""
    now = datetime.now(timezone.utc)
    validation = validate_task(task)

    if not validation["valid"]:
        run = AiTaskRun(
            task_id=task.id,
            status=AiTaskRunStatus.failed,
            planned_action={"instruction": task.instruction, "task_type": task.task_type.value},
            generated_output=None,
            validation_result=validation,
            error_message="Task must be in Family Pledge/Gaza/Islam scope and require admin approval.",
            executed_at=now,
        )
    else:
        try:
            workspace_result = ai_workspace_service.answer_admin_question(
                db,
                "Prepare this scheduled admin task as a reviewable internal draft. "
                "Do not send, publish, approve, confirm, delete, or modify anything.\n\n"
                f"Task: {task.instruction}",
                history=None,
            )
            run = AiTaskRun(
                task_id=task.id,
                status=AiTaskRunStatus.waiting_approval,
                planned_action={"instruction": task.instruction, "task_type": task.task_type.value},
                generated_output={
                    "text": workspace_result["answer"],
                    "context_used": [block["name"] for block in workspace_result["context_used"]],
                    "actions_executed": [],
                },
                validation_result=validation,
                error_message=None,
                executed_at=now,
            )
        except HTTPException as exc:
            run = AiTaskRun(
                task_id=task.id,
                status=AiTaskRunStatus.failed,
                planned_action={"instruction": task.instruction, "task_type": task.task_type.value},
                generated_output=None,
                validation_result=validation,
                error_message=str(exc.detail),
                executed_at=now,
            )

    task.last_run_at = now
    task.next_run_at = _next_run(task, now)
    db.add(task)
    db.add(run)
    db.flush()
    db.add(AdminAuditLog(
        admin_id=admin.id,
        action="ai_task.run",
        entity_type="ai_task",
        entity_id=str(task.id),
        metadata_={"run_id": str(run.id), "status": run.status.value, "actions_executed": []},
    ))
    db.commit()
    db.refresh(run)
    return run


def update_task(db: Session, admin: User, task: AiTask, changes: dict) -> AiTask:
    previous_status = task.status
    explicit_next_run = "next_run_at" in changes
    for key, value in changes.items():
        setattr(task, key, value)

    now = datetime.now(timezone.utc)
    if task.status in (AiTaskStatus.paused, AiTaskStatus.cancelled):
        task.next_run_at = None
    elif task.status == AiTaskStatus.active and not explicit_next_run and (
        previous_status != AiTaskStatus.active or "schedule_type" in changes or "status" in changes
    ):
        task.next_run_at = _next_run(task, now)

    db.add(AdminAuditLog(
        admin_id=admin.id,
        action="ai_task.update",
        entity_type="ai_task",
        entity_id=str(task.id),
        metadata_={"changed_fields": sorted(changes.keys())},
    ))
    db.commit()
    db.refresh(task)
    return task


def retry_run(db: Session, admin: User, run_id: UUID) -> AiTaskRun:
    previous = db.get(AiTaskRun, run_id)
    if previous is None:
        raise HTTPException(404, "AI task run not found")
    if previous.status != AiTaskRunStatus.failed:
        raise HTTPException(400, "Only failed task runs can be retried")
    task = db.get(AiTask, previous.task_id)
    if task is None:
        raise HTTPException(404, "AI task not found")
    return run_task_once(db, admin, task)


def approve_run(db: Session, admin: User, run_id: UUID) -> AiTaskRun:
    run = db.get(AiTaskRun, run_id)
    if run is None:
        raise HTTPException(404, "AI task run not found")
    if run.status != AiTaskRunStatus.waiting_approval:
        raise HTTPException(400, "Only task output waiting for approval can be approved")
    run.status = AiTaskRunStatus.validated
    db.add(AdminAuditLog(
        admin_id=admin.id,
        action="ai_task_run.approve",
        entity_type="ai_task_run",
        entity_id=str(run.id),
        metadata_={"external_actions_executed": []},
    ))
    db.commit()
    db.refresh(run)
    return run


def dismiss_run(db: Session, admin: User, run_id: UUID) -> AiTaskRun:
    run = db.get(AiTaskRun, run_id)
    if run is None:
        raise HTTPException(404, "AI task run not found")
    if run.status not in (AiTaskRunStatus.waiting_approval, AiTaskRunStatus.validated):
        raise HTTPException(400, "This task output cannot be dismissed")
    run.status = AiTaskRunStatus.cancelled
    db.add(AdminAuditLog(
        admin_id=admin.id,
        action="ai_task_run.dismiss",
        entity_type="ai_task_run",
        entity_id=str(run.id),
        metadata_={"external_actions_executed": []},
    ))
    db.commit()
    db.refresh(run)
    return run
