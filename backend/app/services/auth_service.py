from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.security import hash_password, verify_password, create_access_token
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


def register(db: Session, data: RegisterRequest) -> User:
    phone = data.phone.strip()
    email = str(data.email).lower() if data.email else None
    if db.scalar(select(User).where(User.phone == phone)):
        raise HTTPException(400, "Phone number already registered")
    if email and db.scalar(select(User).where(User.email == email)):
        raise HTTPException(400, "Email already registered")

    user = User(
        full_name=data.full_name,
        phone=phone,
        email=email,
        password_hash=hash_password(data.password),
        country=data.country,
        city=data.city,
        nickname=data.nickname,
        role=UserRole.donor,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, data: LoginRequest) -> tuple[User, str]:
    user = db.scalar(
        select(User).where(
            (User.phone == data.identifier) | (User.email == data.identifier),
            User.deleted_at.is_(None),
        )
    )
    if not user or not user.is_active:
        raise HTTPException(401, "Invalid credentials")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token(str(user.id))
    return user, token


def save_push_token(db: Session, user: User, push_token: str) -> None:
    user.push_token = push_token
    db.commit()
