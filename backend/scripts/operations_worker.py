import time
from datetime import datetime, timezone

from sqlalchemy import select

from app.api.routes.daily_reminders import publish_with_notification
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.enums import ReminderStatus
from app.models.reminder import DailyReminder
from app.models.user import User
from app.services import admin_operations_service


def run_iteration() -> None:
    db = SessionLocal()
    try:
        admin_operations_service.process_due_communications(db)
        due = list(db.scalars(
            select(DailyReminder).where(
                DailyReminder.status == ReminderStatus.approved,
                DailyReminder.scheduled_for.is_not(None),
                DailyReminder.scheduled_for <= datetime.now(timezone.utc),
            ).order_by(DailyReminder.scheduled_for.asc()).limit(20)
        ).all())
        for reminder in due:
            admin = db.get(User, reminder.approved_by or reminder.created_by)
            if admin:
                publish_with_notification(db, admin, reminder.id)
    finally:
        db.close()


def main() -> None:
    interval = max(10, int(settings.OUTBOUND_WORKER_INTERVAL_SECONDS))
    followup_counter = 0
    while True:
        try:
            run_iteration()
            followup_counter += interval
            if followup_counter >= 900:
                db = SessionLocal()
                try:
                    admin_operations_service.sync_followups(db)
                finally:
                    db.close()
                followup_counter = 0
        except Exception as exc:
            print(f"operations worker iteration failed: {type(exc).__name__}: {exc}", flush=True)
        time.sleep(interval)


if __name__ == "__main__":
    main()
