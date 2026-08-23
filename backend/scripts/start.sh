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

if [ "${MPESA_RECONCILIATION_ENABLED:-false}" = "true" ]; then
  echo "MPESA_RECONCILIATION_ENABLED=true; starting M-PESA reconciliation worker"
  python -m scripts.mpesa_reconciliation_worker &
fi

# In OVH the backend is not published to the host; Caddy is the only external
# ingress and reaches this service over the private Docker bridge. Trust the
# configured proxy addresses so request.client.host reflects the real donor IP
# used by authentication rate limiting. Local/dev keeps Uvicorn's safe loopback
# default unless FORWARDED_ALLOW_IPS is explicitly set.
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --proxy-headers \
  --forwarded-allow-ips "${FORWARDED_ALLOW_IPS:-127.0.0.1}"
