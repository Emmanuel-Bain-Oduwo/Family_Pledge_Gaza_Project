#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OVH_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${OVH_DIR}/.env}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

: "${POSTGRES_DB:?Set POSTGRES_DB in ${ENV_FILE}}"
: "${POSTGRES_USER:?Set POSTGRES_USER in ${ENV_FILE}}"
: "${BACKUP_R2_ACCOUNT_ID:?Set BACKUP_R2_ACCOUNT_ID in ${ENV_FILE}}"
: "${BACKUP_R2_ACCESS_KEY_ID:?Set BACKUP_R2_ACCESS_KEY_ID in ${ENV_FILE}}"
: "${BACKUP_R2_SECRET_ACCESS_KEY:?Set BACKUP_R2_SECRET_ACCESS_KEY in ${ENV_FILE}}"
: "${BACKUP_R2_BUCKET:?Set BACKUP_R2_BUCKET in ${ENV_FILE}}"

REMOTE_KEY="${1:-}"
if [[ -z "${REMOTE_KEY}" ]]; then
  echo "Usage: $0 <remote-r2-key>" >&2
  echo "Example: $0 db/familypledge-2026-08-04T02-00-00Z.sql.gz" >&2
  exit 1
fi

if [[ "${RESTORE_CONFIRM:-}" != "YES" ]]; then
  echo "Refusing to restore without RESTORE_CONFIRM=YES." >&2
  echo "This operation writes into the OVH PostgreSQL database." >&2
  exit 1
fi

RESTORE_DIR="${RESTORE_DIR:-/tmp/familypledge-db-restore}"
RESTORE_FILE="${RESTORE_DIR}/$(basename "${REMOTE_KEY}")"
R2_ENDPOINT="https://${BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

mkdir -p "${RESTORE_DIR}"

cd "${OVH_DIR}"

echo "Downloading backup from private Cloudflare R2 bucket: s3://${BACKUP_R2_BUCKET}/${REMOTE_KEY}"
AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_ACCESS_KEY}" \
aws s3 cp "s3://${BACKUP_R2_BUCKET}/${REMOTE_KEY}" "${RESTORE_FILE}" \
  --endpoint-url "${R2_ENDPOINT}"

echo "Restoring backup into Docker Compose postgres service..."
gunzip -c "${RESTORE_FILE}" | docker compose exec -T postgres psql -U "${POSTGRES_USER}" "${POSTGRES_DB}"

rm -f "${RESTORE_FILE}"
echo "Restore completed and local temporary file removed."
