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

BACKUP_R2_PREFIX="${BACKUP_R2_PREFIX:-db}"
DATE_UTC="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
BACKUP_DIR="${BACKUP_DIR:-/tmp/familypledge-db-backups}"
BACKUP_FILE="${BACKUP_DIR}/familypledge-${DATE_UTC}.sql.gz"
R2_ENDPOINT="https://${BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
REMOTE_KEY="${BACKUP_R2_PREFIX%/}/familypledge-${DATE_UTC}.sql.gz"

mkdir -p "${BACKUP_DIR}"

cd "${OVH_DIR}"

echo "Creating PostgreSQL backup from Docker Compose postgres service..."
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip -9 > "${BACKUP_FILE}"

echo "Uploading backup to private Cloudflare R2 bucket: s3://${BACKUP_R2_BUCKET}/${REMOTE_KEY}"
AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${BACKUP_FILE}" "s3://${BACKUP_R2_BUCKET}/${REMOTE_KEY}" \
  --endpoint-url "${R2_ENDPOINT}"

rm -f "${BACKUP_FILE}"
echo "Backup uploaded and local temporary file removed."
echo "Remote backup: s3://${BACKUP_R2_BUCKET}/${REMOTE_KEY}"
