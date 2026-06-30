from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.common import PaginatedResponse, make_page
from app.schemas.notification import NotificationOut, NotificationSend
from app.services import notification_service
from app.utils.pagination import offset_limit

router = APIRouter(prefix="/admin/notifications", tags=["Notifications"])


@router.post("/send", response_model=NotificationOut, status_code=201)
def send_notification(
    data: NotificationSend,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return notification_service.send(db, admin, data)


@router.get("", response_model=PaginatedResponse[NotificationOut])
def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = notification_service.list_notifications(db, skip, limit)
    return make_page([NotificationOut.model_validate(n) for n in items], total, page, size)
