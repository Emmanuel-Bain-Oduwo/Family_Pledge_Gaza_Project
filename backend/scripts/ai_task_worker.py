"""Small in-container scheduler for due AI preparation tasks.

The worker only prepares reviewable output. Every task still requires an admin to
review/approve downstream content before anything is sent or published.
"""
import logging
import os
import time

from run_due_ai_tasks import main as run_due_tasks

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("family_pledge.ai_task_worker")


def main() -> None:
    interval = max(int(os.getenv("AI_TASKS_WORKER_INTERVAL_SECONDS", "60")), 30)
    log.info("AI task worker started; interval=%ss", interval)
    while True:
        try:
            run_due_tasks()
        except Exception:
            log.exception("AI task worker iteration failed")
        time.sleep(interval)


if __name__ == "__main__":
    main()
