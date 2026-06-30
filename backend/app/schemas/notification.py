from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationAudience, NotificationType


class NotificationSend(BaseModel):
    title: str
    body: str
    notification_type: NotificationType
    audience: NotificationAudience


class NotificationOut(BaseModel):
    id: UUID
    title: str
    body: str
    notification_type: NotificationType
    audience: NotificationAudience
    sent_by: UUID
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
