"""Run due Family Pledge AI Assistant tasks from a scheduled worker."""
from datetime import datetime, timezone

from sqlalchemy import select, text

from app.core.database import SessionLocal
from app.models.ai_operations import AiTask
from app.models.enums import AiTaskStatus
from app.models.user import User
from app.services.ai_task_service import run_task_once


def main() -> None:
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        if not db.scalar(select(text("pg_try_advisory_lock(742019)"))):
            return
        try:
            tasks = db.scalars(
                select(AiTask)
                .where(
                    AiTask.status == AiTaskStatus.active,
                    AiTask.schedule_type.in_(["daily", "weekly"]),
                    AiTask.next_run_at.is_not(None),
                    AiTask.next_run_at <= now,
                )
                .with_for_update(skip_locked=True)
            ).all()
            for task in tasks:
                admin = db.get(User, task.created_by_admin_id)
                if admin and admin.is_active and admin.deleted_at is None:
                    # run_task_once creates the reviewable output and computes the
                    # next daily/weekly run. It does not send or publish anything.
                    run_task_once(db, admin, task)
        finally:
            db.execute(text("SELECT pg_advisory_unlock(742019)"))
            db.commit()


if __name__ == "__main__":
    main()
