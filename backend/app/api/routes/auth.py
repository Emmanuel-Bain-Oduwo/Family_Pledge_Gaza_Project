from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.rate_limit import rate_limiter
from app.models.user import User
from app.schemas.auth import LoginRequest, PushTokenRequest, RegisterRequest, TokenResponse
from app.schemas.common import MessageResponse
from app.schemas.user import UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limiter.limit(max_requests=5, window_seconds=60)),
):
    user = auth_service.register(db, data)
    from app.core.security import create_access_token
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limiter.limit(max_requests=5, window_seconds=60)),
):
    _, token = auth_service.login(db, data)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user)):
    return MessageResponse(message="Logged out successfully")


@router.post("/save-push-token", response_model=MessageResponse)
def save_push_token(
    data: PushTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.save_push_token(db, current_user, data.push_token)
    return MessageResponse(message="Push token saved")
