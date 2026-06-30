from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.reminder import DailyReminder
from app.models.enums import ReminderStatus
from app.models.user import User
from app.schemas.reminder import ReminderCreate, ReminderUpdate


def list_published(db: Session) -> List[DailyReminder]:
    return list(
        db.scalars(
            select(DailyReminder)
            .where(DailyReminder.status == ReminderStatus.published)
            .order_by(DailyReminder.scheduled_for.desc().nullslast(), DailyReminder.created_at.desc())
        ).all()
    )


def get_today(db: Session) -> Optional[DailyReminder]:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    reminder = db.scalar(
        select(DailyReminder)
        .where(
            DailyReminder.status == ReminderStatus.published,
            DailyReminder.scheduled_for >= today_start,
            DailyReminder.scheduled_for <= today_end,
        )
        .order_by(DailyReminder.scheduled_for.asc())
        .limit(1)
    )
    if not reminder:
        # Fall back to most recently published
        reminder = db.scalar(
            select(DailyReminder)
            .where(DailyReminder.status == ReminderStatus.published)
            .order_by(DailyReminder.created_at.desc())
            .limit(1)
        )
    return reminder


def admin_list(
    db: Session, skip: int = 0, limit: int = 20
) -> Tuple[List[DailyReminder], int]:
    base = select(DailyReminder)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(base.order_by(DailyReminder.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def _get(db: Session, reminder_id: UUID) -> DailyReminder:
    r = db.scalar(select(DailyReminder).where(DailyReminder.id == reminder_id))
    if not r:
        raise HTTPException(404, "Reminder not found")
    return r


def create(db: Session, admin: User, data: ReminderCreate) -> DailyReminder:
    reminder = DailyReminder(
        title=data.title,
        reminder_type=data.reminder_type,
        arabic_text=data.arabic_text,
        translation=data.translation,
        explanation=data.explanation,
        source_reference=data.source_reference,
        image_url=data.image_url,
        scheduled_for=data.scheduled_for,
        status=ReminderStatus.draft,
        created_by=admin.id,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def update(db: Session, admin: User, reminder_id: UUID, data: ReminderUpdate) -> DailyReminder:
    reminder = _get(db, reminder_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(reminder, field, value)
    db.commit()
    db.refresh(reminder)
    return reminder


def approve(db: Session, admin: User, reminder_id: UUID) -> DailyReminder:
    reminder = _get(db, reminder_id)
    if reminder.status not in (ReminderStatus.draft,):
        raise HTTPException(400, "Only draft reminders can be approved")
    reminder.status = ReminderStatus.approved
    reminder.approved_by = admin.id
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="reminder.approve",
            entity_type="reminder",
            entity_id=str(reminder_id),
            metadata_={},
        )
    )
    db.commit()
    db.refresh(reminder)
    return reminder


def publish(db: Session, admin: User, reminder_id: UUID) -> DailyReminder:
    reminder = _get(db, reminder_id)
    if reminder.status not in (ReminderStatus.draft, ReminderStatus.approved):
        raise HTTPException(400, "Reminder must be draft or approved to publish")
    reminder.status = ReminderStatus.published
    if not reminder.approved_by:
        reminder.approved_by = admin.id
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="reminder.publish",
            entity_type="reminder",
            entity_id=str(reminder_id),
            metadata_={},
        )
    )
    db.commit()
    db.refresh(reminder)
    return reminder
