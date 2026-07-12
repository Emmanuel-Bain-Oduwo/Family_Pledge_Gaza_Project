from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest import TestCase, main
from uuid import uuid4

from fastapi import HTTPException

from app.api.routes.mobile import mobile_dashboard
from app.models.enums import UserRole
from app.services import user_service
from app.schemas.user import UserUpdateRequest
from scripts import seed_demo_content


class FakeSession:
    def __init__(self, scalar_results=None):
        self.scalar_results = list(scalar_results or [])
        self.added = []
        self.commits = 0
        self.refreshed = []
        self.flushes = 0

    def scalar(self, _statement):
        if self.scalar_results:
            return self.scalar_results.pop(0)
        return None

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        self.refreshed.append(obj)

    def flush(self):
        self.flushes += 1


def user(role=UserRole.donor):
    return SimpleNamespace(
        id=uuid4(),
        full_name="Donor User",
        nickname=None,
        email="donor@example.com",
        phone="+254700123456",
        country="Kenya",
        city="Nairobi",
        role=role,
        anonymous_publicly=False,
        public_display_name=None,
        is_active=True,
        weekly_email_opt_in=True,
        created_at=datetime.now(timezone.utc),
        collector_profile=None,
        collector_code=None,
        password_hash="existing-hash",
    )


def impact(title, created_at):
    return SimpleNamespace(
        id=uuid4(),
        project_id=None,
        title=title,
        story=f"{title} story",
        beneficiaries_count=10,
        image_url=None,
        video_url=None,
        completed_at=None,
        created_by=uuid4(),
        created_at=created_at,
        updated_at=created_at,
    )


class MobileDashboardImpactTests(TestCase):
    def _session_for_dashboard(self, impact_card=None):
        return FakeSession([
            None,  # active pledge
            0,     # confirmed count
            None,  # this month contribution
            1,     # donor number
            1,     # total donors today
            None,  # active campaign
            None,  # emergency campaign
            None,  # reminder
            impact_card,
            0,     # current contributors
            1,     # total active donors
        ])

    def test_dashboard_returns_200_shape_without_impact_card(self):
        result = mobile_dashboard(current_user=user(), db=self._session_for_dashboard())
        self.assertIsNone(result.latest_impact)

    def test_dashboard_returns_latest_impact_card_when_one_exists(self):
        card = impact("Latest", datetime.now(timezone.utc))
        result = mobile_dashboard(current_user=user(), db=self._session_for_dashboard(card))
        self.assertEqual(result.latest_impact.title, "Latest")

    def test_dashboard_latest_impact_uses_newest_card_by_created_at(self):
        older = impact("Older", datetime.now(timezone.utc) - timedelta(days=1))
        newer = impact("Newer", datetime.now(timezone.utc))
        result = mobile_dashboard(current_user=user(), db=self._session_for_dashboard(newer))
        self.assertEqual(result.latest_impact.title, "Newer")
        self.assertGreater(newer.created_at, older.created_at)


class UserProfileUpdateTests(TestCase):
    def test_patch_users_me_updates_names_email_and_phone_safely(self):
        current = user(role=UserRole.admin)
        db = FakeSession([None, None])
        updated = user_service.update_me(
            db,
            current,
            UserUpdateRequest(
                full_name="  Admin Name  ",
                nickname="  Boss  ",
                email=" ADMIN@EXAMPLE.COM ",
                phone=" +254700000001 ",
            ),
        )
        self.assertEqual(updated.full_name, "Admin Name")
        self.assertEqual(updated.nickname, "Boss")
        self.assertEqual(updated.email, "admin@example.com")
        self.assertEqual(updated.phone, "+254700000001")
        self.assertEqual(updated.role, UserRole.admin)
        self.assertEqual(updated.password_hash, "existing-hash")

    def test_duplicate_email_is_rejected(self):
        current = user(role=UserRole.admin)
        other = user(role=UserRole.donor)
        db = FakeSession([other])
        with self.assertRaises(HTTPException) as ctx:
            user_service.update_me(db, current, UserUpdateRequest(email="other@example.com"))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail, "Email already registered")

    def test_duplicate_phone_is_rejected(self):
        current = user(role=UserRole.admin)
        other = user(role=UserRole.donor)
        db = FakeSession([other])
        with self.assertRaises(HTTPException) as ctx:
            user_service.update_me(db, current, UserUpdateRequest(phone="+254799999999"))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail, "Phone number already registered")

    def test_profile_update_keeps_at_least_one_login_identifier(self):
        current = user(role=UserRole.admin)
        current.email = None
        db = FakeSession([])
        with self.assertRaises(HTTPException) as ctx:
            user_service.update_me(db, current, UserUpdateRequest(phone=" "))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail, "Email or phone is required")


class AdminSeedRoleTests(TestCase):
    def test_new_demo_admin_users_are_created_with_admin_role(self):
        db = FakeSession([None, None])
        admin = seed_demo_content._ensure_demo_admin(
            db,
            admin_email="demo.admin@familypledge.org",
            admin_phone="+254700000001",
            admin_password="ChangeMeDemo123!",
        )
        self.assertEqual(admin.role, UserRole.admin)
        self.assertEqual(len(db.added), 1)

    def test_seed_reuses_existing_admin_after_email_or_phone_change(self):
        existing = user(role=UserRole.admin)
        existing.email = "changed@example.com"
        existing.phone = "+254711111111"
        db = FakeSession([existing])
        admin = seed_demo_content._ensure_demo_admin(
            db,
            admin_email="demo.admin@familypledge.org",
            admin_phone="+254700000001",
            admin_password="ChangeMeDemo123!",
        )
        self.assertIs(admin, existing)
        self.assertEqual(db.added, [])

    def test_seed_converts_existing_legacy_super_admin_to_admin(self):
        existing = user(role=UserRole.super_admin)
        db = FakeSession([existing])
        admin = seed_demo_content._ensure_demo_admin(
            db,
            admin_email="demo.admin@familypledge.org",
            admin_phone="+254700000001",
            admin_password="ChangeMeDemo123!",
        )
        self.assertIs(admin, existing)
        self.assertEqual(admin.role, UserRole.admin)


if __name__ == "__main__":
    main()
