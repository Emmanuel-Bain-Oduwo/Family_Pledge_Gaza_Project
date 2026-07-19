"""
Seed safe owner-demo data for Family Pledge.
"""
from __future__ import annotations

import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal

# PRODUCTION GUARD: MUST BE BEFORE DB CONNECTION
if os.getenv("APP_ENV") == "production":
    allow_seed = os.getenv("ALLOW_DEMO_SEED_IN_PRODUCTION", "").lower()
    if allow_seed != "true":
        print("ERROR: Refusing to seed in production. ALLOW_DEMO_SEED_IN_PRODUCTION is not exactly 'true'.", file=sys.stderr)
        sys.exit(1)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    Campaign, Collector, CollectorMember, Contribution, DailyReminder,
    ImpactCard, NamlefContent, Pledge, Project, User,
)
from app.models.enums import (
    CampaignStatus, CampaignType, ContributionStatus, NamlefContentStatus,
    NamlefContentType, PledgeStatus, PledgeType, ProjectCategory,
    ProjectStatus, ReminderStatus, ReminderType, UserRole,
)
from app.services.settings_service import get_or_create
from app.utils.validators import current_month

def _database_url() -> str:
    value = os.getenv("DATABASE_URL", "").strip()
    if not value:
        print("ERROR: DATABASE_URL is required.", file=sys.stderr)
        sys.exit(1)
    return value

def _user(session: Session, *, email: str, phone: str, name: str, role: UserRole) -> User:
    existing = session.scalar(select(User).where(User.email == email))
    if existing:
        return existing
    user = User(
        full_name=name,
        email=email,
        phone=phone,
        country="Kenya",
        city="Nairobi",
        password_hash=hash_password("DemoUser123!"),
        role=role,
        is_active=True,
        anonymous_publicly=False,
    )
    session.add(user)
    session.flush()
    return user

def _ensure_demo_admin(
    session: Session, *, admin_email: str, admin_phone: str, admin_password: str
) -> User:
    admin = session.scalar(
        select(User).where(
            User.role.in_([UserRole.admin, UserRole.super_admin]),
            User.is_active.is_(True),
        )
    )
    if not admin:
        admin = session.scalar(select(User).where(User.email == admin_email))
    if admin:
        if admin.role == UserRole.super_admin:
            admin.role = UserRole.admin
            session.flush()
        return admin

    admin = User(
        full_name="Family Pledge Demo Admin",
        email=admin_email,
        phone=admin_phone,
        password_hash=hash_password(admin_password),
        role=UserRole.admin,
        country="Kenya",
        city="Nairobi",
        is_active=True,
    )
    session.add(admin)
    session.flush()
    return admin

def seed() -> None:
    engine = create_engine(_database_url(), pool_pre_ping=True)
    month = current_month()

    with Session(engine) as session:
        admin_email = os.getenv("DEMO_ADMIN_EMAIL", "demo.admin@familypledge.org")
        admin = _ensure_demo_admin(
            session,
            admin_email=admin_email,
            admin_phone=os.getenv("DEMO_ADMIN_PHONE", "+254****0001"),
            admin_password=os.getenv("DEMO_ADMIN_PASSWORD", "ChangeMeDemo123!"),
        )

        donors = [
            _user(session, email="amina.demo@familypledge.org", phone="+254****0101", name="Amina Demo Donor", role=UserRole.donor),
            _user(session, email="yusuf.demo@familypledge.org", phone="+254****0102", name="Yusuf Demo Donor", role=UserRole.donor),
            _user(session, email="maryam.demo@familypledge.org", phone="+254****0103", name="Maryam Demo Donor", role=UserRole.donor),
        ]
        collector_user = _user(
            session,
            email="collector.demo@familypledge.org",
            phone="+254****0104",
            name="Hassan Demo Collector",
            role=UserRole.collector,
        )
        collector_user.collector_code = collector_user.collector_code or "FP-DEMO-HASSAN"

        if not session.scalar(select(Collector).where(Collector.collector_code == "FP-DEMO-HASSAN")):
            collector = Collector(
                user_id=collector_user.id,
                collector_code="FP-DEMO-HASSAN",
                group_name="Demo Family Circle",
                country="Kenya",
            )
            session.add(collector)
            session.flush()
            for donor in donors:
                session.add(CollectorMember(collector_id=collector.id, donor_user_id=donor.id))

        pledge_specs = [
            (donors[0], PledgeType.monthly, Decimal("10.00"), "USD"),
            (donors[1], PledgeType.monthly, Decimal("20.00"), "USD"),
            (donors[2], PledgeType.free_participant, Decimal("0.00"), "USD"),
            (collector_user, PledgeType.monthly, Decimal("50.00"), "USD"),
        ]
        for user, pledge_type, amount, currency in pledge_specs:
            if not session.scalar(select(Pledge).where(Pledge.user_id == user.id, Pledge.status == PledgeStatus.active)):
                session.add(
                    Pledge(
                        user_id=user.id,
                        pledge_type=pledge_type,
                        amount=amount,
                        currency=currency,
                        status=PledgeStatus.active,
                        start_date=date.today(),
                    )
                )

        if not session.scalar(select(Campaign).where(Campaign.title == "Demo Monthly Family Pledge")):
            session.add(
                Campaign(
                    title="Demo Monthly Family Pledge",
                    campaign_type=CampaignType.monthly,
                    description="Sample campaign.",
                    target_amount=Decimal("10000.00"),
                    raised_amount=Decimal("720.00"),
                    donor_target=1000,
                    donor_count=72,
                    status=CampaignStatus.active,
                    created_by=admin.id,
                )
            )

        get_or_create(session)
        session.commit()

if __name__ == "__main__":
    seed()
