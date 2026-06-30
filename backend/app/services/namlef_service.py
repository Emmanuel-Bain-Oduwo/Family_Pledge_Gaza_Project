from datetime import datetime, timezone
from typing import List, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.namlef import NamlefContent
from app.models.enums import NamlefContentStatus
from app.models.user import User
from app.schemas.namlef import NamlefContentCreate, NamlefContentUpdate


def list_published(db: Session, skip: int = 0, limit: int = 20) -> Tuple[List[NamlefContent], int]:
    base = select(NamlefContent).where(NamlefContent.status == NamlefContentStatus.published)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(base.order_by(NamlefContent.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def list_featured(db: Session) -> List[NamlefContent]:
    return list(
        db.scalars(
            select(NamlefContent)
            .where(
                NamlefContent.status == NamlefContentStatus.published,
                NamlefContent.is_featured.is_(True),
            )
            .order_by(NamlefContent.created_at.desc())
        ).all()
    )


def _get(db: Session, content_id: UUID) -> NamlefContent:
    c = db.scalar(select(NamlefContent).where(NamlefContent.id == content_id))
    if not c:
        raise HTTPException(404, "NAMLEF content not found")
    return c


def create(db: Session, admin: User, data: NamlefContentCreate) -> NamlefContent:
    content = NamlefContent(
        title=data.title,
        speaker_name=data.speaker_name,
        speaker_role=data.speaker_role,
        content_type=data.content_type,
        description=data.description,
        url=data.url,
        thumbnail_url=data.thumbnail_url,
        is_featured=data.is_featured,
        status=data.status,
        created_by=admin.id,
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


def update(db: Session, admin: User, content_id: UUID, data: NamlefContentUpdate) -> NamlefContent:
    content = _get(db, content_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(content, field, value)
    db.commit()
    db.refresh(content)
    return content


def delete(db: Session, admin: User, content_id: UUID) -> None:
    content = _get(db, content_id)
    content.status = NamlefContentStatus.archived
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="namlef.delete",
            entity_type="namlef_content",
            entity_id=str(content_id),
            metadata_={},
        )
    )
    db.commit()
