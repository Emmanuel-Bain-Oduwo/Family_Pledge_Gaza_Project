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

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
