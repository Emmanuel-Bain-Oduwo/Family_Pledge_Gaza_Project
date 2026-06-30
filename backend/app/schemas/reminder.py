from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReminderStatus, ReminderType


class ReminderCreate(BaseModel):
    title: str
    reminder_type: ReminderType
    arabic_text: Optional[str] = None
    translation: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    image_url: Optional[str] = None
    scheduled_for: Optional[datetime] = None


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    reminder_type: Optional[ReminderType] = None
    arabic_text: Optional[str] = None
    translation: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    image_url: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    status: Optional[ReminderStatus] = None


class ReminderOut(BaseModel):
    id: UUID
    title: str
    reminder_type: ReminderType
    arabic_text: Optional[str] = None
    translation: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    image_url: Optional[str] = None
    status: ReminderStatus
    scheduled_for: Optional[datetime] = None
    created_by: UUID
    approved_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
