from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.api.routes import storage


def test_valid_broad_media_types(monkeypatch):
    monkeypatch.setattr(storage.settings, "R2_MAX_UPLOAD_MB", 500)
    assert storage.validate_upload("photo.JPG", "image/jpeg", 10_000) == "image/jpeg"
    assert storage.validate_upload("appeal.mp4", "video/mp4", 50_000_000) == "video/mp4"
    assert storage.validate_upload("report.pdf", "application/pdf", 2_000_000) == "application/pdf"
    assert storage.validate_upload("sheet.xlsx", "application/octet-stream", 2_000) == "application/octet-stream"


@pytest.mark.parametrize("filename", ["run.exe", "page.html", "script.js", "shell.sh", "app.apk"])
def test_dangerous_extensions_are_rejected(monkeypatch, filename):
    monkeypatch.setattr(storage.settings, "R2_MAX_UPLOAD_MB", 500)
    with pytest.raises(HTTPException) as exc:
        storage.validate_upload(filename, "application/octet-stream", 1)
    assert exc.value.status_code == 400
    assert exc.value.detail == "This file type is not allowed for security reasons."


def test_configurable_size_ceiling(monkeypatch):
    monkeypatch.setattr(storage.settings, "R2_MAX_UPLOAD_MB", 10)
    with pytest.raises(HTTPException) as exc:
        storage.validate_upload("video.mp4", "video/mp4", 10 * 1024 * 1024 + 1)
    assert exc.value.status_code == 413


def test_safe_object_key_preserves_normalized_extension():
    key = storage.make_object_key("projects", " Gaza Update FINAL.PDF ", datetime(2026, 7, 26, tzinfo=timezone.utc))
    assert key.startswith("family-pledge/projects/2026/07/")
    assert key.endswith("-gaza-update-final.pdf")
    assert " " not in key


def test_missing_r2_configuration_is_friendly(monkeypatch):
    monkeypatch.setattr(storage.settings, "R2_ACCOUNT_ID", "")
    with pytest.raises(HTTPException) as exc:
        storage._require_r2_config()
    assert exc.value.status_code == 503
    assert exc.value.detail == "Media storage is not configured. Please contact admin."


def test_presigned_response_schema_cannot_include_credentials():
    assert "secret" not in storage.PresignedUploadOut.model_fields
    assert "access_key" not in storage.PresignedUploadOut.model_fields


def test_r2_objects_use_immutable_browser_cache_policy():
    assert storage.R2_CACHE_CONTROL == "public, max-age=31536000, immutable"


def test_storage_routes_require_admin_dependency():
    from app.core.deps import require_admin

    protected_paths = {
        "/admin/storage/r2-presigned-upload",
        "/admin/storage/r2-confirm-upload",
        "/admin/storage/usage",
    }
    for route in storage.router.routes:
        if route.path in protected_paths:
            dependencies = {dependency.call for dependency in route.dependant.dependencies}
            assert require_admin in dependencies


def test_confirm_upload_creates_media_asset(monkeypatch):
    from types import SimpleNamespace
    from uuid import uuid4

    class FakeDb:
        def __init__(self):
            self.saved = None
        def scalar(self, _query):
            return None
        def add(self, value):
            self.saved = value
        def commit(self):
            pass
        def refresh(self, value):
            if value.id is None:
                value.id = uuid4()
            if value.created_at is None:
                value.created_at = datetime.now(timezone.utc)

    monkeypatch.setattr(storage, "_require_r2_config", lambda: None)
    monkeypatch.setattr(storage.settings, "R2_PUBLIC_BASE_URL", "https://media.familypledge.org")
    monkeypatch.setattr(storage.settings, "R2_MAX_UPLOAD_MB", 500)
    key = "family-pledge/impact/2026/07/asset-impact.jpg"
    db = FakeDb()
    saved = storage.confirm_upload(
        storage.ConfirmUploadRequest(
            object_key=key,
            public_url=f"https://media.familypledge.org/{key}",
            original_filename="impact.jpg",
            content_type="image/jpeg",
            size_bytes=1234,
            folder="impact",
            related_entity_type="impact",
            related_entity_id=uuid4(),
        ),
        SimpleNamespace(id=uuid4()),
        db,
    )
    assert saved is db.saved
    assert saved.status == "uploaded"
    assert saved.related_entity_type == "impact"
    assert saved.uploaded_at is not None
