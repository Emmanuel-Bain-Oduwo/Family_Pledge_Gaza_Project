from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import (
    AnonymousUpdateRequest,
    BadgeOut,
    EmailPreferenceRequest,
    UserOut,
    UserUpdateRequest,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_me(db, current_user, data)


@router.patch("/me/anonymous", response_model=UserOut)
def update_anonymous(
    data: AnonymousUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_anonymous(db, current_user, data)


@router.patch("/me/email-preferences", response_model=UserOut)
def update_email_preferences(
    data: EmailPreferenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_email_preferences(
        db, current_user, data.weekly_email_opt_in
    )


@router.get("/unsubscribe-weekly-email/{token}", response_model=UserOut)
def unsubscribe_weekly_email(token: str, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(
            User.email_unsubscribe_token == token, User.deleted_at.is_(None)
        )
    )
    if not user:
        raise HTTPException(status_code=404, detail="Unsubscribe link is invalid")
    return user_service.update_email_preferences(db, user, False)


@router.get("/me/badges", response_model=List[BadgeOut])
def get_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.get_badges(db, current_user.id)
