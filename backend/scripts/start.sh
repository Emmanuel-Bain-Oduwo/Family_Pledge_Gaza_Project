#!/usr/bin/env sh
set -eu

if [ "${RUN_MIGRATIONS_ON_STARTUP:-false}" = "true" ]; then
  echo "RUN_MIGRATIONS_ON_STARTUP=true; running alembic upgrade head"
  alembic upgrade head
fi

if [ "${DEMO_SEED_ON_STARTUP:-false}" = "true" ]; then
  echo "DEMO_SEED_ON_STARTUP=true; running demo seed"
  python scripts/seed_demo_content.py
fi

if [ "${AI_TASKS_WORKER_ENABLED:-false}" = "true" ]; then
  echo "AI_TASKS_WORKER_ENABLED=true; starting review-only AI task worker"
  python -m scripts.ai_task_worker &
fi

if [ "${OUTBOUND_WORKER_ENABLED:-false}" = "true" ]; then
  echo "OUTBOUND_WORKER_ENABLED=true; starting admin operations worker"
  python -m scripts.operations_worker &
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
