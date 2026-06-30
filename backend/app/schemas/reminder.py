from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.enums import ReminderStatus, ReminderType


class ReminderCreate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None  # alias for title accepted from admin frontend
    reminder_type: Optional[ReminderType] = None
    type: Optional[str] = None  # alias for reminder_type accepted from admin frontend
    arabic_text: Optional[str] = None
    translation: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    image_url: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    scheduled_date: Optional[str] = None  # date string from admin form

    @model_validator(mode='after')
    def resolve_aliases(self) -> 'ReminderCreate':
        if self.reminder_type is None and self.type is not None:
            try:
                self.reminder_type = ReminderType(self.type)
            except ValueError:
                self.reminder_type = ReminderType.motivation
        if self.reminder_type is None:
            self.reminder_type = ReminderType.motivation
        if self.title is None and self.text is not None:
            self.title = self.text
        if self.title is None:
            self.title = ''
        return self


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None  # alias — mapped to title
    reminder_type: Optional[ReminderType] = None
    type: Optional[str] = None  # alias — mapped to reminder_type
    arabic_text: Optional[str] = None
    translation: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    image_url: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    scheduled_date: Optional[str] = None
    status: Optional[ReminderStatus] = None

    @model_validator(mode='after')
    def resolve_aliases(self) -> 'ReminderUpdate':
        if self.reminder_type is None and self.type is not None:
            try:
                self.reminder_type = ReminderType(self.type)
            except ValueError:
                pass
        if self.title is None and self.text is not None:
            self.title = self.text
        return self


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

    # Frontend-compatible alias fields
    type: Optional[str] = None
    text: Optional[str] = None
    date: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def compute_alias_fields(self) -> 'ReminderOut':
        self.type = self.reminder_type.value
        self.text = self.title
        self.date = self.created_at.isoformat()
        return self
