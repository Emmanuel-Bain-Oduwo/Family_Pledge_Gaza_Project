from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate


def list_projects(
    db: Session, skip: int = 0, limit: int = 20
) -> Tuple[List[Project], int]:
    base = select(Project).where(Project.deleted_at.is_(None))
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(base.order_by(Project.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def get_by_id(db: Session, project_id: UUID) -> Project:
    project = db.scalar(
        select(Project).where(Project.id == project_id, Project.deleted_at.is_(None))
    )
    if not project:
        raise HTTPException(404, "Project not found")
    return project


def create(db: Session, admin: User, data: ProjectCreate) -> Project:
    project = Project(
        title=data.title,
        category=data.category,
        description=data.description,
        target_amount=data.target_amount,
        beneficiaries_count=data.beneficiaries_count,
        status=data.status,
        location=data.location,
        cover_image_url=data.cover_image_url,
        video_url=data.video_url,
        created_by=admin.id,
    )
    db.add(project)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="project.create",
            entity_type="project",
            entity_id=None,
            metadata_={"title": data.title},
        )
    )
    db.commit()
    db.refresh(project)
    return project


def update(db: Session, admin: User, project_id: UUID, data: ProjectUpdate) -> Project:
    project = get_by_id(db, project_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="project.update",
            entity_type="project",
            entity_id=str(project_id),
            metadata_={},
        )
    )
    db.commit()
    db.refresh(project)
    return project


def delete(db: Session, admin: User, project_id: UUID) -> None:
    project = get_by_id(db, project_id)
    project.deleted_at = datetime.now(timezone.utc)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="project.delete",
            entity_type="project",
            entity_id=str(project_id),
            metadata_={},
        )
    )
    db.commit()
