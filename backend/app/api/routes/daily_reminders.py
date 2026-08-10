from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.enums import NotificationAudience, NotificationType, ReminderStatus, ReminderType
from app.models.reminder import DailyReminder
from app.models.user import User
from app.schemas.common import PaginatedResponse, make_page
from app.schemas.notification import NotificationSend
from app.schemas.reminder import ReminderCreate, ReminderOut, ReminderUpdate
from app.services import notification_service, reminder_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Daily Reminders"])


@router.get("/daily-reminders", response_model=List[ReminderOut])
def list_reminders(db: Session = Depends(get_db)):
    return reminder_service.list_published(db)


@router.get("/daily-reminders/today", response_model=Optional[ReminderOut])
def today_reminder(db: Session = Depends(get_db)):
    return reminder_service.get_today(db)


@router.get("/admin/daily-reminders", response_model=PaginatedResponse[ReminderOut])
def admin_list_reminders(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    reminder_type: ReminderType | None = Query(None),
    status: ReminderStatus | None = Query(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    query = select(DailyReminder)
    if reminder_type:
        query = query.where(DailyReminder.reminder_type == reminder_type)
    if status:
        query = query.where(DailyReminder.status == status)
    total = int(db.scalar(select(func.count()).select_from(query.subquery())) or 0)
    items = list(db.scalars(query.order_by(DailyReminder.created_at.desc()).offset(skip).limit(limit)).all())
    return make_page([ReminderOut.model_validate(item) for item in items], total, page, size)


@router.post("/admin/daily-reminders", response_model=ReminderOut, status_code=201)
def admin_create_reminder(
    data: ReminderCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return reminder_service.create(db, admin, data)


@router.patch("/admin/daily-reminders/{reminder_id}", response_model=ReminderOut)
def admin_update_reminder(
    reminder_id: UUID,
    data: ReminderUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return reminder_service.update(db, admin, reminder_id, data)


@router.patch("/admin/daily-reminders/{reminder_id}/approve", response_model=ReminderOut)
def admin_approve_reminder(
    reminder_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return reminder_service.approve(db, admin, reminder_id)


def _notification_category(reminder: DailyReminder) -> str:
    mapping = {
        ReminderType.quran: "quran",
        ReminderType.hadith: "hadith",
        ReminderType.dua: "dua",
        ReminderType.motivation: "motivation",
        ReminderType.friday: "pledge",
        ReminderType.sadaqah: "pledge",
    }
    return mapping.get(reminder.reminder_type, "general")


def publish_with_notification(db: Session, admin: User, reminder_id: UUID) -> DailyReminder:
    reminder = reminder_service.publish(db, admin, reminder_id)
    notification_service.send(
        db,
        admin,
        NotificationSend(
            title=reminder.title or "Family Pledge Reminder",
            body=reminder.translation or reminder.explanation or reminder.title,
            notification_type=NotificationType.reminder,
            audience=NotificationAudience.all_users,
            content_category=_notification_category(reminder),
        ),
    )
    return reminder


@router.patch("/admin/daily-reminders/{reminder_id}/publish", response_model=ReminderOut)
def admin_publish_reminder(
    reminder_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return publish_with_notification(db, admin, reminder_id)
