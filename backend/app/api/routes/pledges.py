from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.pledge import PledgeCreate, PledgeOut, PledgeStatusOut, PledgeUpdate
from app.services import pledge_service

router = APIRouter(prefix="/pledges", tags=["Pledges"])


@router.post("", response_model=PledgeOut, status_code=201)
def create_pledge(
    data: PledgeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return pledge_service.create_pledge(db, current_user, data)


@router.get("/me", response_model=List[PledgeOut])
def get_my_pledges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return pledge_service.get_my_pledges(db, current_user.id)


@router.get("/me/status", response_model=PledgeStatusOut)
def get_pledge_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return pledge_service.get_pledge_status(db, current_user.id)


@router.patch("/{pledge_id}", response_model=PledgeOut)
def update_pledge(
    pledge_id: str,
    data: PledgeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    return pledge_service.update_pledge(db, current_user, UUID(pledge_id), data)
