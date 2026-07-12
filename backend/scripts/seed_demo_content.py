"""
Seed safe owner-demo data for Family Pledge.

Usage:
    DATABASE_URL=postgresql://... python backend/scripts/seed_demo_content.py

Optional environment variables:
    DEMO_ADMIN_EMAIL      default: demo.admin@familypledge.org
    DEMO_ADMIN_PHONE      default: +254700000001
    DEMO_ADMIN_PASSWORD   default: ChangeMeDemo123!

All seeded content is intentionally labeled as demo/sample/example content and
does not claim verified real-world impact.
"""

from __future__ import annotations

import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    Campaign,
    Collector,
    CollectorMember,
    Contribution,
    DailyReminder,
    ImpactCard,
    NamlefContent,
    Pledge,
    Project,
    User,
)
from app.models.enums import (
    CampaignStatus,
    CampaignType,
    ContributionStatus,
    NamlefContentStatus,
    NamlefContentType,
    PledgeStatus,
    PledgeType,
    ProjectCategory,
    ProjectStatus,
    ReminderStatus,
    ReminderType,
    UserRole,
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


def seed() -> None:
    engine = create_engine(_database_url(), pool_pre_ping=True)
    month = current_month()

    with Session(engine) as session:
        admin_email = os.getenv("DEMO_ADMIN_EMAIL", "demo.admin@familypledge.org")
        admin = session.scalar(select(User).where(User.email == admin_email))
        if not admin:
            admin = User(
                full_name="Family Pledge Demo Admin",
                email=admin_email,
                phone=os.getenv("DEMO_ADMIN_PHONE", "+254700000001"),
                password_hash=hash_password(os.getenv("DEMO_ADMIN_PASSWORD", "ChangeMeDemo123!")),
                role=UserRole.super_admin,
                country="Kenya",
                city="Nairobi",
                is_active=True,
            )
            session.add(admin)
            session.flush()

        donors = [
            _user(session, email="amina.demo@familypledge.org", phone="+254700000101", name="Amina Demo Donor", role=UserRole.donor),
            _user(session, email="yusuf.demo@familypledge.org", phone="+254700000102", name="Yusuf Demo Donor", role=UserRole.donor),
            _user(session, email="maryam.demo@familypledge.org", phone="+254700000103", name="Maryam Demo Donor", role=UserRole.donor),
        ]
        collector_user = _user(
            session,
            email="collector.demo@familypledge.org",
            phone="+254700000104",
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
                    description="Sample campaign showing how families can pledge monthly support without claiming verified real impact.",
                    target_amount=Decimal("10000.00"),
                    raised_amount=Decimal("720.00"),
                    donor_target=1000,
                    donor_count=72,
                    status=CampaignStatus.active,
                    created_by=admin.id,
                )
            )

        if not session.scalar(select(Project).where(Project.title == "Demo Family Support Project")):
            project = Project(
                title="Demo Family Support Project",
                category=ProjectCategory.general,
                description="Example project card for food, water, clothing, and family support presentation content.",
                target_amount=Decimal("5000.00"),
                raised_amount=Decimal("350.00"),
                beneficiaries_count=0,
                status=ProjectStatus.active,
                location="Gaza / Palestine family support",
                created_by=admin.id,
            )
            session.add(project)
            session.flush()
            session.add(
                ImpactCard(
                    project_id=project.id,
                    title="Sample impact update",
                    story="Demo update: this card shows the style of verified impact reporting once real owner-approved updates are added.",
                    beneficiaries_count=0,
                    completed_at=datetime.now(timezone.utc),
                    created_by=admin.id,
                )
            )

        reminder_titles = {
            ReminderType.quran: "Demo Quran reminder",
            ReminderType.hadith: "Demo hadith reminder",
            ReminderType.dua: "Demo dua reminder",
            ReminderType.motivation: "Demo motivation reminder",
            ReminderType.friday: "Demo Friday reminder",
            ReminderType.sadaqah: "Demo sadaqah reminder",
        }
        for reminder_type, title in reminder_titles.items():
            if not session.scalar(select(DailyReminder).where(DailyReminder.title == title)):
                session.add(
                    DailyReminder(
                        title=title,
                        reminder_type=reminder_type,
                        translation="Sample reminder content for owner demo. Replace with approved organization content before public launch.",
                        explanation="Designed to keep the app warm, spiritual, and active during presentation.",
                        source_reference="Demo content",
                        status=ReminderStatus.published,
                        scheduled_for=datetime.now(timezone.utc),
                        created_by=admin.id,
                        approved_by=admin.id,
                    )
                )

        awareness_items = [
            ("Example awareness book", NamlefContentType.text),
            ("Example awareness video", NamlefContentType.video),
            ("Example awareness podcast", NamlefContentType.audio),
            ("Example awareness article", NamlefContentType.link),
        ]
        for title, content_type in awareness_items:
            if not session.scalar(select(NamlefContent).where(NamlefContent.title == title)):
                session.add(
                    NamlefContent(
                        title=title,
                        speaker_name="Family Pledge Team",
                        speaker_role="Demo content",
                        content_type=content_type,
                        description="Sample awareness resource placeholder for owner demo.",
                        url="https://familypledge.org/en/",
                        is_featured=True,
                        status=NamlefContentStatus.published,
                        created_by=admin.id,
                    )
                )

        for donor, amount, status, ref in [
            (donors[0], Decimal("10.00"), ContributionStatus.confirmed, "DEMO-CONFIRMED-001"),
            (donors[1], Decimal("20.00"), ContributionStatus.submitted, "DEMO-PENDING-002"),
        ]:
            if not session.scalar(select(Contribution).where(Contribution.transaction_reference == ref)):
                pledge = session.scalar(select(Pledge).where(Pledge.user_id == donor.id, Pledge.status == PledgeStatus.active))
                session.add(
                    Contribution(
                        user_id=donor.id,
                        pledge_id=pledge.id if pledge else None,
                        amount=amount,
                        currency="USD",
                        contribution_channel="demo_manual",
                        transaction_reference=ref,
                        proof_image_url="https://example.com/demo-proof",
                        status=status,
                        contribution_month=month,
                        confirmed_by=admin.id if status == ContributionStatus.confirmed else None,
                        confirmed_at=datetime.now(timezone.utc) if status == ContributionStatus.confirmed else None,
                    )
                )

        get_or_create(session)
        session.commit()

    print("Demo seed complete.")
    print(f"Admin login: {admin_email} / {os.getenv('DEMO_ADMIN_PASSWORD', 'ChangeMeDemo123!')}")
    print("Seeded: settings, admin, donors, pledges, contributions, campaign, project, impact, reminders, awareness content, collector circle.")


if __name__ == "__main__":
    seed()
