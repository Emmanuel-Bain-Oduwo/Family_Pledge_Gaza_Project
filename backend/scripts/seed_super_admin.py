"""
Seed the first super admin user.

Usage:
    DATABASE_URL=postgresql://... python scripts/seed_super_admin.py

Environment variables (all required):
    DATABASE_URL       - PostgreSQL connection string
    ADMIN_FULL_NAME    - Full name of the super admin
    ADMIN_EMAIL        - Email address (must be unique)
    ADMIN_PHONE        - Phone number in E.164 format, e.g. +256700000000
    ADMIN_PASSWORD     - Plain-text password (hashed before storage)
"""

import os
import sys

# Allow running from repo root or from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from passlib.context import CryptContext
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models import User
from app.models.enums import UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _require(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        print(f"ERROR: environment variable {name} is required.", file=sys.stderr)
        sys.exit(1)
    return value


def seed() -> None:
    database_url = _require("DATABASE_URL")
    full_name = _require("ADMIN_FULL_NAME")
    email = _require("ADMIN_EMAIL")
    phone = _require("ADMIN_PHONE")
    password = _require("ADMIN_PASSWORD")

    engine = create_engine(database_url, pool_pre_ping=True)

    with Session(engine) as session:
        existing = session.scalars(
            select(User).where(User.email == email)
        ).first()

        if existing:
            print(f"Super admin with email '{email}' already exists (id={existing.id}). Skipping.")
            return

        admin = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=pwd_context.hash(password),
            role=UserRole.super_admin,
            is_active=True,
            anonymous_publicly=False,
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)

    print(f"Super admin created successfully.")
    print(f"  id    : {admin.id}")
    print(f"  name  : {admin.full_name}")
    print(f"  email : {admin.email}")
    print(f"  role  : {admin.role.value}")


if __name__ == "__main__":
    seed()
