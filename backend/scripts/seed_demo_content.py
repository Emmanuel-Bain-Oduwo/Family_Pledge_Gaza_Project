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

def seed() -> None:
    engine = create_engine(_database_url(), pool_pre_ping=True)
    with Session(engine) as session:
        # Existing safe seed logic goes here.
        # Guard prevents reaching this point in production.
        pass

if __name__ == "__main__":
    seed()
