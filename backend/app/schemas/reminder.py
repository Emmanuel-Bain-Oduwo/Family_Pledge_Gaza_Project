from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.enums import ReminderStatus, ReminderType

DhikrCategory = Literal[
    "morning",
    "evening",
    "anytime",
    "protection",
    "after_prayer",
    "before_sleep",
]


def _resolve_type(reminder_type: ReminderType | None, alias: str | None) -> ReminderType:
    resolved = reminder_type
    if resolved is None and alias is not None:
        try:
            resolved = ReminderType(alias)
        except ValueError as exc:
            raise ValueError("Choose a supported reminder type") from exc
    if resolved is None:
        resolved = ReminderType.motivation
    if resolved == ReminderType.shirk:
        raise ValueError("Shirk is not an available Family Pledge reminder category")
    return resolved


class ReminderCreate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    reminder_type: Optional[ReminderType] = None
    type: Optional[str] = None
    dhikr_category: Optional[DhikrCategory] = None
    arabic_text: Optional[str] = None
    translation: Optional[str] = None
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    image_url: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    scheduled_date: Optional[str] = None

    @model_validator(mode='after')
    def resolve_aliases(self) -> 'ReminderCreate':
        self.reminder_type = _resolve_type(self.reminder_type, self.type)
        if self.reminder_type == ReminderType.dhikr:
            self.dhikr_category = self.dhikr_category or "anytime"
        else:
            self.dhikr_category = None
        if self.title is None and self.text is not None:
            self.title = self.text
        if self.title is None:
            self.title = ''
        return self


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    reminder_type: Optional[ReminderType] = None
    type: Optional[str] = None
    dhikr_category: Optional[DhikrCategory] = None
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
        if self.reminder_type == ReminderType.shirk or self.type == ReminderType.shirk.value:
            raise ValueError("Shirk is not an available Family Pledge reminder category")
        if self.reminder_type is None and self.type is not None:
            try:
                self.reminder_type = ReminderType(self.type)
            except ValueError as exc:
                raise ValueError("Choose a supported reminder type") from exc
        if self.reminder_type is not None and self.reminder_type != ReminderType.dhikr:
            self.dhikr_category = None
        if self.title is None and self.text is not None:
            self.title = self.text
        return self


class ReminderOut(BaseModel):
    id: UUID
    title: str
    reminder_type: ReminderType
    dhikr_category: Optional[str] = None
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
