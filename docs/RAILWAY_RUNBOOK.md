# Railway Rollback / Legacy Runbook

Railway is **not the primary Family Pledge production backend anymore**. The production target is OVH at:

```text
https://api.familypledgekenya.org/api/v1
```

Keep Railway only as a temporary rollback/fallback while the OVH database migration and full application verification are completed.

## When to use this runbook

Use Railway only when:

- production data still needs to be exported from Railway;
- a deliberate rollback is required before OVH is fully accepted;
- an old Railway deployment needs to be inspected for comparison/recovery.

Do not point normal production traffic to Railway after OVH has passed the final acceptance checklist.

## Required Railway variables while fallback is retained

```env
APP_ENV=production
API_V1_PREFIX=/api/v1
DATABASE_URL=<Railway Postgres URL>
JWT_SECRET=<Railway JWT secret>
CORS_ORIGINS=https://family-pledge-gaza-project.vercel.app,https://family-pledge-gaza-project-demo.vercel.app
```

Do not commit real secrets.

## Export the Railway production database

Before retiring Railway, export the data that must be moved to OVH:

```bash
pg_dump "$RAILWAY_DATABASE_URL" | gzip > railway-familypledge.sql.gz
```

Restore instructions are in `deploy/ovh/README.md` and `docs/DEPLOYMENT.md`.

## Railway startup behavior

The backend container starts the API with Uvicorn. Migrations and demo seeding should not be enabled casually.

Controlled optional variables:

```env
RUN_MIGRATIONS_ON_STARTUP=true
DEMO_SEED_ON_STARTUP=true
```

For retained production/fallback data, avoid demo seeding unless it is explicitly required for a non-production demo environment.

## Railway health checks

If the fallback service is still online, verify its actual Railway hostname before using these commands:

```bash
curl https://familypledgegazaproject-production.up.railway.app/health
curl https://familypledgegazaproject-production.up.railway.app/ready
```

The production frontend should **not** normally use this Railway hostname after the OVH cutover.

## Controlled rollback procedure

If OVH develops a blocking issue before migration is complete:

1. Confirm Railway backend/database are still healthy.
2. Change the affected Vercel frontend API variable back to the known-good Railway API base.
3. Redeploy that frontend.
4. Keep the rollback temporary.
5. Resolve the OVH issue and re-run the acceptance checklist before cutting back.

Do not delete or overwrite either database during an emergency rollback without a clear source-of-truth decision.

## Migration recovery notes

If Railway Alembic previously reported enum conflicts such as an existing `user_role` type, do not delete the database or blindly stamp Alembic head. Verify the actual schema and use the repository's current migrations.

If password-hash compatibility is being investigated, inspect only aggregate hash-prefix counts. Do not print or export actual password hashes.

## Retirement criteria

Railway can be shut down after all of the following are true:

- required production records are present on OVH PostgreSQL;
- admin authentication works against OVH;
- donor registration/login works against OVH;
- contribution and content flows work;
- R2 and Stream media paths work;
- private R2 database backup succeeds on OVH;
- both Vercel frontends point to OVH;
- native Android/iOS release candidates use OVH;
- a deliberate stability window has passed.

After retirement, keep this file only as historical recovery documentation unless the Railway fallback is formally removed from the project.
