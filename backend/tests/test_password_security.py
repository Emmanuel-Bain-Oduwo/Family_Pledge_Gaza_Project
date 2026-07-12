from types import SimpleNamespace
from unittest import TestCase, main

from fastapi import HTTPException

from app.core.security import hash_password, verify_password
from app.schemas.auth import LoginRequest, RegisterRequest
from scripts import seed_demo_content
from app.services import auth_service


DEMO_ADMIN_PASSWORD = "ChangeMeDemo123!"


class FakeSession:
    def __init__(self, scalar_results=None):
        self.scalar_results = list(scalar_results or [])
        self.added = []
        self.commits = 0
        self.refreshed = []

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
        pass


class PasswordSecurityTests(TestCase):
    def test_hash_password_creates_argon2id_hash(self):
        hashed = hash_password("CorrectHorseBatteryStaple")
        self.assertTrue(hashed.startswith("$argon2id$"))
        self.assertNotEqual(hashed, "CorrectHorseBatteryStaple")

    def test_correct_password_verification_succeeds(self):
        hashed = hash_password("CorrectHorseBatteryStaple")
        self.assertTrue(verify_password("CorrectHorseBatteryStaple", hashed))

    def test_incorrect_password_verification_returns_false(self):
        hashed = hash_password("CorrectHorseBatteryStaple")
        self.assertFalse(verify_password("wrong-password", hashed))

    def test_unicode_passwords_work(self):
        password = "أمان-🔐-Family-Pledge-123"
        hashed = hash_password(password)
        self.assertTrue(verify_password(password, hashed))

    def test_long_password_above_bcrypt_boundary_is_not_truncated(self):
        prefix = "a" * 72
        password = prefix + "RIGHT_SUFFIX"
        wrong_same_bcrypt_prefix = prefix + "WRONG_SUFFIX"
        hashed = hash_password(password)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password(wrong_same_bcrypt_prefix, hashed))

    def test_malformed_stored_hash_fails_safely(self):
        self.assertFalse(verify_password("anything", "not-a-password-hash"))

    def test_demo_admin_password_hashes_and_verifies(self):
        hashed = hash_password(DEMO_ADMIN_PASSWORD)
        self.assertTrue(hashed.startswith("$argon2id$"))
        self.assertTrue(verify_password(DEMO_ADMIN_PASSWORD, hashed))

    def test_normal_user_password_hashes_and_verifies(self):
        password = "NormalUser123"
        hashed = hash_password(password)
        self.assertTrue(hashed.startswith("$argon2id$"))
        self.assertTrue(verify_password(password, hashed))


class AuthServicePasswordTests(TestCase):
    def _register_request(self, *, phone="+254700123456", email="donor@example.com", password="NormalUser123"):
        return RegisterRequest(
            full_name="Normal Donor",
            phone=phone,
            email=email,
            password=password,
            country="Kenya",
            city="Nairobi",
        )

    def test_registration_stores_hash_never_plaintext(self):
        db = FakeSession(scalar_results=[None, None])
        user = auth_service.register(db, self._register_request())
        self.assertEqual(user, db.added[0])
        self.assertNotEqual(user.password_hash, "NormalUser123")
        self.assertTrue(user.password_hash.startswith("$argon2id$"))
        self.assertTrue(verify_password("NormalUser123", user.password_hash))

    def test_duplicate_phone_registration_is_rejected(self):
        db = FakeSession(scalar_results=[SimpleNamespace(id="existing-user")])
        with self.assertRaises(HTTPException) as ctx:
            auth_service.register(db, self._register_request())
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail, "Phone number already registered")

    def test_duplicate_email_registration_is_rejected(self):
        db = FakeSession(scalar_results=[None, SimpleNamespace(id="existing-user")])
        with self.assertRaises(HTTPException) as ctx:
            auth_service.register(db, self._register_request())
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail, "Email already registered")

    def test_newly_registered_user_can_log_in_by_phone(self):
        password = "NormalUser123"
        user = SimpleNamespace(
            id="user-1",
            phone="+254700123456",
            email="donor@example.com",
            is_active=True,
            password_hash=hash_password(password),
            deleted_at=None,
        )
        db = FakeSession(scalar_results=[user])
        logged_in_user, token = auth_service.login(
            db, LoginRequest(identifier="+254700123456", password=password)
        )
        self.assertEqual(logged_in_user, user)
        self.assertTrue(token)

    def test_newly_registered_user_can_log_in_by_email(self):
        password = "NormalUser123"
        user = SimpleNamespace(
            id="user-1",
            phone="+254700123456",
            email="donor@example.com",
            is_active=True,
            password_hash=hash_password(password),
            deleted_at=None,
        )
        db = FakeSession(scalar_results=[user])
        logged_in_user, token = auth_service.login(
            db, LoginRequest(identifier="donor@example.com", password=password)
        )
        self.assertEqual(logged_in_user, user)
        self.assertTrue(token)

    def test_wrong_password_is_rejected(self):
        user = SimpleNamespace(
            id="user-1",
            is_active=True,
            password_hash=hash_password("NormalUser123"),
            deleted_at=None,
        )
        db = FakeSession(scalar_results=[user])
        with self.assertRaises(HTTPException) as ctx:
            auth_service.login(db, LoginRequest(identifier="donor@example.com", password="WrongPassword123"))
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail, "Invalid credentials")

    def test_inactive_user_cannot_log_in(self):
        user = SimpleNamespace(
            id="user-1",
            is_active=False,
            password_hash=hash_password("NormalUser123"),
            deleted_at=None,
        )
        db = FakeSession(scalar_results=[user])
        with self.assertRaises(HTTPException) as ctx:
            auth_service.login(db, LoginRequest(identifier="donor@example.com", password="NormalUser123"))
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail, "Invalid credentials")


class DemoSeedAdminTests(TestCase):
    def test_ordinary_seed_preserves_existing_demo_admin_password_hash(self):
        first_session = FakeSession(scalar_results=[None])
        admin = seed_demo_content._ensure_demo_admin(
            first_session,
            admin_email="demo.admin@familypledge.org",
            admin_phone="+254700000001",
            admin_password=DEMO_ADMIN_PASSWORD,
        )

        self.assertEqual(len(first_session.added), 1)
        self.assertEqual(admin, first_session.added[0])
        original_hash = admin.password_hash
        self.assertTrue(original_hash.startswith("$argon2id$"))
        self.assertTrue(verify_password(DEMO_ADMIN_PASSWORD, original_hash))

        second_session = FakeSession(scalar_results=[admin])
        same_admin = seed_demo_content._ensure_demo_admin(
            second_session,
            admin_email="demo.admin@familypledge.org",
            admin_phone="+254700000001",
            admin_password="ChangedDemoPassword123!",
        )

        self.assertEqual(same_admin, admin)
        self.assertEqual(second_session.added, [])
        self.assertEqual(admin.password_hash, original_hash)
        self.assertTrue(verify_password(DEMO_ADMIN_PASSWORD, admin.password_hash))
        self.assertFalse(verify_password("ChangedDemoPassword123!", admin.password_hash))


class PasswordValidationTests(TestCase):
    def test_password_max_length_rejects_abusive_input(self):
        with self.assertRaises(ValueError):
            RegisterRequest(
                full_name="Normal Donor",
                phone="+254700123456",
                email="donor@example.com",
                password="a" * 129,
            )

    def test_password_min_length_is_preserved(self):
        with self.assertRaises(ValueError):
            RegisterRequest(
                full_name="Normal Donor",
                phone="+254700123456",
                email="donor@example.com",
                password="short",
            )


if __name__ == "__main__":
    main()
