"""Purge sensitive contribution proof data after the configured retention period.

Run daily from cron/systemd on the OVH host. The accounting contribution row is
preserved; only the private screenshot/object pointer, legacy public proof URL,
and raw transaction reference/message are removed.
"""
from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import unquote, urlparse

from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.contribution import Contribution
from app.models.media_asset import MediaAsset
from app.services.private_proof_service import delete_object as delete_private_object


def _delete_legacy_public_object(url: str) -> None:
    """Best-effort delete for legacy proof objects stored in the public media R2 bucket."""
    public_base = settings.R2_PUBLIC_BASE_URL.rstrip("/")
    if not public_base or not url.startswith(public_base + "/"):
        return

    from app.api.routes.storage import _r2_client

    object_key = unquote(urlparse(url).path.lstrip("/"))
    if not object_key.startswith("family-pledge/contribution_proofs/"):
        return
    _r2_client().delete_object(Bucket=settings.R2_BUCKET_NAME, Key=object_key)


def purge_expired() -> tuple[int, int]:
    now = datetime.now(timezone.utc)
    purged = 0
    failed = 0
    db = SessionLocal()
    try:
        rows = list(
            db.scalars(
                select(Contribution).where(
                    Contribution.proof_expires_at.is_not(None),
                    Contribution.proof_expires_at <= now,
                )
            ).all()
        )

        for contribution in rows:
            try:
                if contribution.proof_object_key:
                    delete_private_object(contribution.proof_object_key)
                    asset = db.scalar(
                        select(MediaAsset).where(
                            MediaAsset.object_key == contribution.proof_object_key
                        )
                    )
                    if asset:
                        asset.status = "deleted"
                        asset.deleted_at = now

                if contribution.proof_image_url:
                    _delete_legacy_public_object(contribution.proof_image_url)

                contribution.proof_object_key = None
                contribution.proof_image_url = None
                contribution.transaction_reference = None
                contribution.proof_expires_at = None
                purged += 1
            except Exception as exc:
                # Keep the DB pointer when object deletion failed so the next run
                # can retry and we never claim the screenshot was removed when it
                # may still exist in storage.
                failed += 1
                db.rollback()
                print(
                    f"Failed to purge contribution {contribution.id}: "
                    f"{type(exc).__name__}: {exc}"
                )
                continue

            db.commit()

        return purged, failed
    finally:
        db.close()


if __name__ == "__main__":
    purged_count, failed_count = purge_expired()
    print(f"Purged expired contribution proofs: {purged_count}")
    print(f"Failed purges: {failed_count}")
    raise SystemExit(1 if failed_count else 0)
