# Railway Backend Runbook

This runbook covers the production Railway backend for the Family Pledge API.

## Required environment variables

Set these on the Railway backend service:

```bash
APP_ENV=production
API_V1_PREFIX=/api/v1
DATABASE_URL=<Railway Postgres URL>
JWT_SECRET=<32+ char secret>
CORS_ORIGINS=https://family-pledge-gaza-project.vercel.app,https://family-pledge-gaza-project-demo.vercel.app
```

Do not commit real secrets. `DATABASE_URL` must point to the Railway Postgres database that should hold production data.

## Default startup behavior

The Docker container starts the API only:

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Migrations and demo seeding are **not** run automatically by default.

Optional startup controls are available when you intentionally want Railway to perform setup during container startup:

```bash
RUN_MIGRATIONS_ON_STARTUP=true
DEMO_SEED_ON_STARTUP=true
```

Use these carefully. The safer production workflow is to run migrations and seed commands explicitly with Railway CLI.

## Run migrations after deploy

Run Alembic migrations against the deployed backend service environment:

```bash
railway run --service <backend-service-name> alembic upgrade head
```

If this command fails, check that `DATABASE_URL` points to the intended Railway Postgres database and that the backend service can connect to it.

## Seed demo data manually

Only run the demo seed when you intentionally want sample/demo data and the demo admin user:

```bash
railway run --service <backend-service-name> python scripts/seed_demo_content.py
```

The demo login seeded by that script is:

```json
{"identifier":"demo.admin@familypledge.org","password":"ChangeMeDemo123!"}
```

Do not set `DEMO_SEED_ON_STARTUP=true` unless repeated idempotent demo seeding on startup is desired.

## Post-deploy checks

Replace the host below if Railway provides a different backend domain.

```bash
curl https://familypledgegazaproject-production.up.railway.app/health
curl https://familypledgegazaproject-production.up.railway.app/ready
curl https://familypledgegazaproject-production.up.railway.app/api/v1/campaigns
curl https://familypledgegazaproject-production.up.railway.app/api/v1/projects
curl https://familypledgegazaproject-production.up.railway.app/api/v1/daily-reminders
curl -X POST https://familypledgegazaproject-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"demo.admin@familypledge.org","password":"ChangeMeDemo123!"}'
```

## Interpreting `/ready`

`/ready` returns operational database and migration state without exposing secrets:

```json
{
  "status": "ready",
  "service": "family-pledge-api",
  "database": "connected",
  "migrations": "ok",
  "missing_tables": [],
  "cors_origins_configured": 2
}
```

- `status=ready`, `database=connected`, and `migrations=ok`: the API can reach the database and core tables exist.
- `database=failed`: Railway cannot connect to the configured database. Check `DATABASE_URL`, Railway networking, and database availability.
- `migrations=missing_tables`: database connectivity works, but one or more required tables are absent. Run `railway run --service <backend-service-name> alembic upgrade head`.
- Non-empty `missing_tables`: the listed tables are absent from the configured database.
- `cors_origins_configured` should be `2` for the two Vercel frontend origins listed above.

Unhandled database exceptions are logged in Railway logs with request method/path context, while API responses return a generic database error and do not expose credentials or connection strings.

## Alembic enum migration recovery

If `alembic upgrade head` previously failed with an error like:

```text
psycopg2.errors.DuplicateObject: type "user_role" already exists
```

that means PostgreSQL is reachable, but revision `0001` encountered enum types that were already present from a partial migration attempt. Do **not** delete the Railway Postgres database, do **not** manually drop enum types, and do **not** stamp Alembic head unless the tables were actually created.

After deploying the fixed migration, rerun:

```bash
railway run --service <backend-service-name> alembic upgrade head
```

The initial migration now creates PostgreSQL enum types with `checkfirst=True` and reuses those same enum objects in table columns, so existing enum types are detected and reused while missing application tables are still created.

## Password hash migration verification

The backend now creates new password hashes with pwdlib's recommended Argon2id hasher. Before deciding whether legacy bcrypt compatibility is needed, inspect the deployed database for existing bcrypt password hashes:

```bash
railway run --service <backend-service-name> python - <<'PY'
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
with engine.connect() as conn:
    row = conn.execute(text("""
        SELECT
            COUNT(*) AS total_users,
            COUNT(*) FILTER (
                WHERE password_hash LIKE '$2a$%'
                   OR password_hash LIKE '$2b$%'
                   OR password_hash LIKE '$2y$%'
            ) AS bcrypt_users,
            COUNT(*) FILTER (WHERE password_hash LIKE '$argon2id$%') AS argon2id_users
        FROM users
    """)).mappings().one()
    print(dict(row))
PY
```

- If `bcrypt_users` is `0`, no legacy bcrypt compatibility is needed.
- If `bcrypt_users` is greater than `0`, do not delete users or reset real passwords automatically. Add an isolated legacy verification and rehash-on-success path before removing bcrypt support.
- Do not print or export actual `password_hash` values.
