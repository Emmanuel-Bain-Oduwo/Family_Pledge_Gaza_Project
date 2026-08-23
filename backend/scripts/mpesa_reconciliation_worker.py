import logging
import time

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.payments.reconciliation_service import reconcile_batch


logging.basicConfig(level=logging.INFO)
log = logging.getLogger("mpesa-reconciliation-worker")


def run() -> None:
    if not settings.MPESA_RECONCILIATION_ENABLED:
        log.info("M-PESA reconciliation worker disabled")
        return
    log.info(
        "M-PESA reconciliation worker started (interval=%ss batch=%s)",
        settings.MPESA_RECONCILIATION_INTERVAL_SECONDS,
        settings.MPESA_RECONCILIATION_BATCH_SIZE,
    )
    while True:
        db = SessionLocal()
        try:
            stats = reconcile_batch(db)
            if stats["checked"]:
                log.info("M-PESA reconciliation: %s", stats)
        except Exception:
            db.rollback()
            log.exception("M-PESA reconciliation iteration failed")
        finally:
            db.close()
        time.sleep(max(settings.MPESA_RECONCILIATION_INTERVAL_SECONDS, 30))


if __name__ == "__main__":
    run()
