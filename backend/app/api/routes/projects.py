from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse, make_page
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services import project_service
from app.utils.pagination import offset_limit

router = APIRouter(tags=["Projects"])


@router.get("/projects", response_model=PaginatedResponse[ProjectOut])
def list_projects(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    skip, limit = offset_limit(page, size)
    items, total = project_service.list_projects(db, skip, limit)
    return make_page([ProjectOut.model_validate(p) for p in items], total, page, size)


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    return project_service.get_by_id(db, project_id)


@router.post("/admin/projects", response_model=ProjectOut, status_code=201)
def admin_create_project(
    data: ProjectCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return project_service.create(db, admin, data)


@router.patch("/admin/projects/{project_id}", response_model=ProjectOut)
def admin_update_project(
    project_id: UUID,
    data: ProjectUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return project_service.update(db, admin, project_id, data)


@router.delete("/admin/projects/{project_id}", response_model=MessageResponse)
def admin_delete_project(
    project_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project_service.delete(db, admin, project_id)
    return MessageResponse(message="Project deleted")
