from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.settings import AppSettings
from app.schemas.settings import AppSettingsUpdate


def get_or_create(db: Session) -> AppSettings:
    settings = db.scalar(select(AppSettings).order_by(AppSettings.created_at.asc()))
    if settings:
        return settings
    settings = AppSettings()
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update(db: Session, data: AppSettingsUpdate) -> AppSettings:
    settings = get_or_create(db)
    values = data.model_dump(exclude_unset=True)
    for key, value in values.items():
        if value is not None:
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
