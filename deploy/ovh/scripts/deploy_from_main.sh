#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="${FAMILY_PLEDGE_REPO_DIR:-${HOME}/Family_Pledge_Gaza_Project}"
DEPLOY_DIR="${REPO_DIR}/deploy/ovh"
EXPECTED_SHA="${FAMILY_PLEDGE_EXPECTED_SHA:-}"
API_ORIGIN="${FAMILY_PLEDGE_API_ORIGIN:-https://api.familypledgekenya.org}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"

log() {
  printf '[deploy] %s\n' "$*"
}

if [[ ! -d "${REPO_DIR}/.git" ]]; then
  echo "Repository not found at ${REPO_DIR}" >&2
  exit 1
fi

if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
  echo "OVH environment file not found at ${DEPLOY_DIR}/.env" >&2
  exit 1
fi

cd "${REPO_DIR}"
log "Fetching origin/main"
git fetch --prune origin main

ORIGIN_SHA="$(git rev-parse origin/main)"
if [[ -n "${EXPECTED_SHA}" && "${ORIGIN_SHA}" != "${EXPECTED_SHA}" ]]; then
  log "Skipping deploy: successful CI was for ${EXPECTED_SHA}, but origin/main is now ${ORIGIN_SHA}."
  log "A newer main CI run should deploy the newer commit when it succeeds."
  exit 0
fi

log "Synchronizing server checkout to origin/main (${ORIGIN_SHA})"
git checkout main
git reset --hard "${ORIGIN_SHA}"

cd "${DEPLOY_DIR}"

if [[ "${BACKUP_BEFORE_DEPLOY}" == "true" ]]; then
  log "Creating pre-deploy database backup"
  bash scripts/backup_db_to_r2.sh
fi

log "Building backend image"
docker compose build backend

log "Running Alembic migrations with the new image"
docker compose run --rm --no-deps backend alembic upgrade head

log "Recreating updated services"
docker compose up -d --build --remove-orphans

log "Waiting for backend health and readiness"
ready=0
for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error "${API_ORIGIN}/health" >/dev/null \
    && curl --fail --silent --show-error "${API_ORIGIN}/ready" >/dev/null; then
    ready=1
    break
  fi
  log "Health check attempt ${attempt}/30 not ready yet; retrying in 5s"
  sleep 5
done

if [[ "${ready}" != "1" ]]; then
  echo "Deployment failed health/readiness verification." >&2
  docker compose ps >&2 || true
  docker compose logs --tail=150 backend >&2 || true
  exit 1
fi

log "Verifying migration head"
docker compose exec -T backend alembic current

log "Deployment healthy"
docker compose ps
printf '[deploy] deployed_sha=%s\n' "$(git -C "${REPO_DIR}" rev-parse HEAD)"
