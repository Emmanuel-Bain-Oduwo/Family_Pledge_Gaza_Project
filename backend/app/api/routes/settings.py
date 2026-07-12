from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.settings import AppSettingsOut, AppSettingsUpdate
from app.services import settings_service

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])


@router.get("", response_model=AppSettingsOut)
def get_settings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return settings_service.get_or_create(db)


@router.put("", response_model=AppSettingsOut)
def update_settings(
    data: AppSettingsUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return settings_service.update(db, data)
