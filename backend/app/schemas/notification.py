from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationAudience, NotificationType

NotificationContentCategory = Literal[
    "quran",
    "hadith",
    "dua",
    "motivation",
    "impact",
    "humanitarian",
    "campaign",
    "emergency",
    "pledge",
    "general",
]


class NotificationSend(BaseModel):
    title: str
    body: str
    notification_type: NotificationType
    audience: NotificationAudience
    content_category: NotificationContentCategory | None = None


class NotificationOut(BaseModel):
    id: UUID
    title: str
    body: str
    notification_type: NotificationType
    content_category: Optional[str] = None
    audience: NotificationAudience
    sent_by: UUID
    sent_at: Optional[datetime] = None
    sent_count: int = 0
    failure_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
