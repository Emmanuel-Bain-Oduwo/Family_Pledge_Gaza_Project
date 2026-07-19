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
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.models.password_reset import PasswordResetToken


def request_password_reset(db: Session, identifier: str) -> None:
    """Generate a password reset token for the user identified by phone or email."""
    user = db.scalar(
        select(User).where(
            (User.phone == identifier) | (User.email == identifier),
            User.deleted_at.is_(None),
            User.is_active == True,
        )
    )
    if not user:
        # Return silently to prevent user enumeration
        return

    # Invalidate all previous unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).update({"used": True})

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(reset_token)
    db.commit()

    # In a real application, this is where you would send the raw_token
    # to the user via email or SMS. For this implementation raw_token
    # is expected to be delivered through a separate notification channel.
    # For testing purposes we return nothing; the token is stored hashed.


def confirm_password_reset(db: Session, token: str, new_password: str) -> None:
    """Verify a reset token and update the user's password."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    now = datetime.now(timezone.utc)

    reset_token = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > now,
        )
    )
    if not reset_token:
        raise HTTPException(400, "Invalid or expired reset token")

    user = db.get(User, reset_token.user_id)
    if not user or not user.is_active:
        raise HTTPException(400, "Invalid or expired reset token")

    user.password_hash = hash_password(new_password)
    reset_token.used = True
    db.commit()
