# OVHcloud Backend Deployment Runbook

This folder is the production runbook for the Family Pledge backend on OVHcloud. Railway is retained only as a temporary rollback source until the OVH deployment, data migration, and frontend cutover are fully verified.

## Production architecture

- **Cloudflare**: DNS/proxy in front of the API, public media domain, R2, and Stream.
- **OVH VM**: Docker Compose stack containing PostgreSQL, FastAPI, and Caddy.
- **Admin frontend**: Vercel (`frontend/admin`).
- **Donor web frontend**: Vercel Expo web export (`frontend/mobile`).
- **Native donor app**: Expo/EAS for Android and iOS.
- **Railway**: rollback/fallback only during migration.

Production API:

```text
https://api.familypledgekenya.org/api/v1
```

Health endpoints:

```text
https://api.familypledgekenya.org/health
https://api.familypledgekenya.org/ready
```

## Services in the Compose stack

- `postgres`: PostgreSQL 15 with a persistent Docker volume.
- `backend`: FastAPI application built from `../../backend`.
- `caddy`: reverse proxy and automatic HTTPS for `api.familypledgekenya.org`.

## 1. Prepare the OVH server

Install Docker, Docker Compose, Git, and AWS CLI:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git awscli
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in so the Docker group is active.

## 2. Clone and configure

```bash
git clone https://github.com/Emmanuel-Bain-Oduwo/Family_Pledge_Gaza_Project.git
cd Family_Pledge_Gaza_Project/deploy/ovh
cp .env.example .env
nano .env
```

Never commit the real `.env` file.

For the first controlled migration deploy only:

```env
RUN_MIGRATIONS_ON_STARTUP=true
```

After migrations pass and `/ready` reports `migrations: ok`, change it to:

```env
RUN_MIGRATIONS_ON_STARTUP=false
```

## 3. Start the production stack

```bash
docker compose up -d --build
```

Inspect state and logs:

```bash
docker compose ps
docker compose logs -f backend
```

Local backend checks from inside the backend container:

```bash
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/health').read().decode())"
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/ready').read().decode())"
```

Public checks:

```bash
curl -i https://api.familypledgekenya.org/health
curl -i https://api.familypledgekenya.org/ready
```

Both should return HTTP 200 before frontend cutover.

## 4. Railway to OVH database migration

Keep Railway online until the existing production data is restored and verified on OVH.

Export Railway PostgreSQL from a trusted machine:

```bash
pg_dump "$RAILWAY_DATABASE_URL" | gzip > railway-familypledge.sql.gz
```

Copy it to OVH:

```bash
scp railway-familypledge.sql.gz ubuntu@<OVH_SERVER_IP>:/tmp/
```

Restore into the OVH PostgreSQL container:

```bash
cd ~/Family_Pledge_Gaza_Project/deploy/ovh
gunzip -c /tmp/railway-familypledge.sql.gz | docker compose exec -T postgres psql -U familypledge familypledge
```

Then run migrations once:

```bash
docker compose exec backend alembic upgrade head
```

Verify:

```bash
curl -i https://api.familypledgekenya.org/ready
```

Do not delete Railway until existing admins/users and production records have been verified on OVH.

## 5. Cloudflare DNS and TLS

Production DNS must route:

```text
api.familypledgekenya.org -> OVH public IPv4
```

Caddy obtains the origin certificate and Cloudflare should use **Full (strict)** SSL/TLS mode once origin HTTPS is valid.

A direct origin TLS check can be performed with the OVH IP while preserving SNI:

```bash
curl -i --resolve api.familypledgekenya.org:443:<OVH_PUBLIC_IP> \
  https://api.familypledgekenya.org/health
```

## 6. Cloudflare R2 media

Production public media bucket:

```text
family-pledge-media
```

Production public media base URL:

```text
https://familypledgekenya.org
```

Required backend variables are documented in `.env.example`. R2 API credentials remain backend-only. Browser upload flows must have an R2 CORS policy that allows the intended frontend origins and required upload headers.

## 7. Cloudflare Stream

Videos are uploaded to Cloudflare Stream through backend-mediated direct-upload endpoints. Configure backend-only:

```env
STREAM_API_TOKEN=<secret>
STREAM_CUSTOMER_CODE=<customer-code>
STREAM_MAX_DURATION_SECONDS=21600
```

Test at least one short admin video upload and confirm that the video appears in Cloudflare Stream and completes processing.

## 8. Private database backups to R2

Production private backup bucket:

```text
family-pledge-backup-db
```

This bucket must remain private and must not have a public custom domain.

The AWS CLI used by the backup script must use a Cloudflare R2-compatible region. The recommended setting is:

```bash
aws configure set region auto
```

or in the environment:

```env
AWS_DEFAULT_REGION=auto
```

Manual backup test:

```bash
cd ~/Family_Pledge_Gaza_Project/deploy/ovh
bash scripts/backup_db_to_r2.sh
```

A successful run ends with a remote key similar to:

```text
s3://family-pledge-backup-db/db/familypledge-YYYY-MM-DDTHH-MM-SSZ.sql.gz
```

Run daily after manual verification, for example at 2 AM:

```cron
0 2 * * * cd /home/ubuntu/Family_Pledge_Gaza_Project/deploy/ovh && bash scripts/backup_db_to_r2.sh >> /var/log/familypledge-db-backup.log 2>&1
```

## 9. Restore from a private R2 backup

List the selected private backup object, then restore deliberately:

```bash
cd ~/Family_Pledge_Gaza_Project/deploy/ovh
RESTORE_CONFIRM=YES bash scripts/restore_db_from_backup.sh db/familypledge-YYYY-MM-DDTHH-MM-SSZ.sql.gz
```

Do not restore over production data without a verified recovery plan.

## 10. Frontend production variables

Admin Vercel project:

```env
NEXT_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

Donor Expo web Vercel project:

```env
EXPO_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

Native EAS development/preview/production profiles are also configured to use the same API base.

The OVH backend `CORS_ORIGINS` must include the browser origins actually used by the admin and donor web deployments. Native Android/iOS requests do not depend on browser CORS in the same way.

## 11. Production verification checklist

Before retiring Railway, verify all of the following against OVH:

- `/health` returns HTTP 200.
- `/ready` returns HTTP 200 and database/migrations are healthy.
- Existing admin login works after production-data migration.
- New donor registration and donor login work.
- Admin and donor web requests appear in OVH backend logs.
- Contribution submission and admin review work.
- Campaign/project/impact/reminder/NAMLEF flows work.
- R2 image/file upload works end-to-end.
- Cloudflare Stream video upload and playback work end-to-end.
- Push-token registration is tested in a native EAS build.
- AI endpoints remain admin-only and draft/suggest-only.
- A private R2 database backup succeeds and can be located in the bucket.

## 12. Rollback

If a blocking OVH issue occurs before migration is complete:

1. Keep Railway backend/database intact.
2. Point frontend API variables back to the known-good Railway endpoint only if a rollback is required.
3. Redeploy the affected frontend.
4. Investigate OVH without deleting the fallback data source.

Railway should be removed only after the OVH database contains the required production data and the full application path has been verified under real traffic.
