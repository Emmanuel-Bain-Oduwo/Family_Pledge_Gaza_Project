from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.reminder import DailyReminder
from app.models.enums import ReminderStatus, ReminderType
from app.models.user import User
from app.schemas.reminder import ReminderCreate, ReminderUpdate

SOURCE_REQUIRED_TYPES = {ReminderType.quran, ReminderType.hadith, ReminderType.dhikr}


def _public_reminder_filters():
    return (
        DailyReminder.status == ReminderStatus.published,
        DailyReminder.reminder_type != ReminderType.shirk,
    )


def list_published(db: Session) -> List[DailyReminder]:
    return list(
        db.scalars(
            select(DailyReminder)
            .where(*_public_reminder_filters())
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
            *_public_reminder_filters(),
            DailyReminder.scheduled_for >= today_start,
            DailyReminder.scheduled_for <= today_end,
        )
        .order_by(DailyReminder.scheduled_for.asc())
        .limit(1)
    )
    if not reminder:
        reminder = db.scalar(
            select(DailyReminder)
            .where(*_public_reminder_filters())
            .order_by(DailyReminder.created_at.desc())
            .limit(1)
        )
    return reminder


def admin_list(
    db: Session, skip: int = 0, limit: int = 20
) -> Tuple[List[DailyReminder], int]:
    base = select(DailyReminder).where(DailyReminder.reminder_type != ReminderType.shirk)
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


def _ensure_publishable(reminder: DailyReminder) -> None:
    if reminder.reminder_type == ReminderType.shirk:
        raise HTTPException(400, "This retired reminder category cannot be approved or published")
    if reminder.reminder_type == ReminderType.dhikr and not reminder.dhikr_category:
        reminder.dhikr_category = "anytime"
    if reminder.reminder_type in SOURCE_REQUIRED_TYPES and not (reminder.source_reference or "").strip():
        raise HTTPException(
            400,
            "Add a verified source reference before approving Quran, Hadith, or Dhikr content",
        )


def create(db: Session, admin: User, data: ReminderCreate) -> DailyReminder:
    reminder = DailyReminder(
        title=data.title,
        reminder_type=data.reminder_type,
        dhikr_category=data.dhikr_category,
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


_REMINDER_ALIAS_FIELDS = {'type', 'text', 'scheduled_date'}


def update(db: Session, admin: User, reminder_id: UUID, data: ReminderUpdate) -> DailyReminder:
    reminder = _get(db, reminder_id)
    for field, value in data.model_dump(exclude_none=True).items():
        if field not in _REMINDER_ALIAS_FIELDS and hasattr(reminder, field):
            setattr(reminder, field, value)
    if reminder.reminder_type == ReminderType.dhikr and not reminder.dhikr_category:
        reminder.dhikr_category = "anytime"
    if reminder.reminder_type != ReminderType.dhikr:
        reminder.dhikr_category = None
    db.commit()
    db.refresh(reminder)
    return reminder


def approve(db: Session, admin: User, reminder_id: UUID) -> DailyReminder:
    reminder = _get(db, reminder_id)
    if reminder.status not in (ReminderStatus.draft,):
        raise HTTPException(400, "Only draft reminders can be approved")
    _ensure_publishable(reminder)
    reminder.status = ReminderStatus.approved
    reminder.approved_by = admin.id
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="reminder.approve",
            entity_type="reminder",
            entity_id=str(reminder_id),
            metadata_={"source_reference_present": bool(reminder.source_reference)},
        )
    )
    db.commit()
    db.refresh(reminder)
    return reminder


def publish(db: Session, admin: User, reminder_id: UUID) -> DailyReminder:
    reminder = _get(db, reminder_id)
    if reminder.status not in (ReminderStatus.draft, ReminderStatus.approved):
        raise HTTPException(400, "Reminder must be draft or approved to publish")
    _ensure_publishable(reminder)
    reminder.status = ReminderStatus.published
    if not reminder.approved_by:
        reminder.approved_by = admin.id
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="reminder.publish",
            entity_type="reminder",
            entity_id=str(reminder_id),
            metadata_={"source_reference_present": bool(reminder.source_reference)},
        )
    )
    db.commit()
    db.refresh(reminder)
    return reminder
