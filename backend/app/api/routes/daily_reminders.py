from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse, make_page
from app.schemas.reminder import ReminderCreate, ReminderOut, ReminderUpdate
from app.services import reminder_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Daily Reminders"])


@router.get("/daily-reminders", response_model=List[ReminderOut])
def list_reminders(db: Session = Depends(get_db)):
    return reminder_service.list_published(db)


@router.get("/daily-reminders/today", response_model=Optional[ReminderOut])
def today_reminder(db: Session = Depends(get_db)):
    return reminder_service.get_today(db)


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


@router.patch("/admin/daily-reminders/{reminder_id}/publish", response_model=ReminderOut)
def admin_publish_reminder(
    reminder_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return reminder_service.publish(db, admin, reminder_id)
