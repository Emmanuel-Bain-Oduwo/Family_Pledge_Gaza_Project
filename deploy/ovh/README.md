# OVHcloud backend deployment runbook

This folder prepares the existing Family Pledge backend for OVHcloud while keeping Railway as a temporary fallback during migration.

## Target architecture

- OVH b3-8 runs the FastAPI backend, PostgreSQL, and Caddy reverse proxy.
- Cloudflare handles DNS, SSL edge security, admin/mobile web frontends, R2 media storage, and Stream video delivery.
- Railway remains online for 24-72 hours after cutover, then can be stopped once OVH is stable.

## Services in this compose stack

- `postgres`: PostgreSQL 15 with a named Docker volume.
- `backend`: FastAPI app built from `../../backend/Dockerfile`.
- `caddy`: reverse proxy and automatic HTTPS for `api.familypledge.org`.

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

Use strong passwords/secrets. Never commit `.env`.

For the first deploy only:

```env
RUN_MIGRATIONS_ON_STARTUP=true
```

After the first successful deploy and `/ready` passes, change it to:

```env
RUN_MIGRATIONS_ON_STARTUP=false
```

## 3. Start OVH backend stack

```bash
docker compose up -d --build
```

Check logs:

```bash
docker compose logs -f backend
```

Health checks:

```bash
curl http://127.0.0.1/health
curl http://127.0.0.1/ready
```

After DNS points `api.familypledge.org` to this OVH instance:

```bash
curl https://api.familypledge.org/health
curl https://api.familypledge.org/ready
```

## 4. Railway to OVH database migration

Keep Railway running during this step.

Export Railway PostgreSQL from a safe machine with `pg_dump`:

```bash
pg_dump "$RAILWAY_DATABASE_URL" | gzip > railway-familypledge.sql.gz
```

Copy the backup to the OVH server:

```bash
scp railway-familypledge.sql.gz ubuntu@<OVH_SERVER_IP>:/tmp/
```

Restore into the OVH PostgreSQL container:

```bash
cd Family_Pledge_Gaza_Project/deploy/ovh
gunzip -c /tmp/railway-familypledge.sql.gz | docker compose exec -T postgres psql -U familypledge familypledge
```

Run migrations once if needed:

```bash
docker compose exec backend alembic upgrade head
```

## 5. Production verification checklist

Before switching DNS permanently, test:

- `/health`
- `/ready`
- admin login
- donor login/register
- contribution submission and admin review
- campaigns
- projects
- impact cards
- reminders
- NAMLEF content
- R2 non-video upload
- Cloudflare Stream video upload
- AI weekly summary
- AI draft creation
- AI scheduled task run-now creates a reviewable task run only

Only switch DNS after all checks pass.

## 6. Cloudflare DNS cutover

In Cloudflare DNS:

```txt
api.familypledge.org -> OVH public IPv4 address
```

Use proxied mode only after HTTPS and app checks pass. Keep Railway alive for 24-72 hours as a rollback option.

## 7. Database backups to private Cloudflare R2

Create a separate private R2 bucket for database backups, for example:

```txt
familypledge-db-backups
```

Do not attach a public custom domain to this bucket. It must remain private.

Install AWS CLI on OVH if not already installed:

```bash
sudo apt install -y awscli
```

Test a manual backup:

```bash
cd Family_Pledge_Gaza_Project/deploy/ovh
bash scripts/backup_db_to_r2.sh
```

Run daily at 2 AM with cron:

```bash
sudo crontab -e
```

Add:

```cron
0 2 * * * cd /home/ubuntu/Family_Pledge_Gaza_Project/deploy/ovh && bash scripts/backup_db_to_r2.sh >> /var/log/familypledge-db-backup.log 2>&1
```

Keep at least 7 daily backups. The script uploads backups but does not delete remote backups automatically, so retention can be handled manually or by a later safe lifecycle rule.

## 8. Restore from R2 backup

List objects in the private backup bucket from your Cloudflare dashboard or AWS CLI. Then restore a selected backup:

```bash
cd Family_Pledge_Gaza_Project/deploy/ovh
RESTORE_CONFIRM=YES bash scripts/restore_db_from_backup.sh db/familypledge-2026-08-04T02-00-00Z.sql.gz
```

## 9. AI safety during OVH migration

AI must keep using backend services only. Do not give the model direct PostgreSQL credentials.

The existing AI assistant and AI operations system should remain draft/suggest-only unless an admin approves the output. The OVH endpoint for GPT-OSS-120B should be configured with backend-only variables:

```env
OPENAI_API_KEY=<ovh-ai-key>
OPENAI_BASE_URL=<ovh-gpt-oss-120b-openai-compatible-base-url>
OPENAI_MODEL=gpt-oss-120b
```

## 10. Rollback

If OVH fails after DNS cutover:

1. Point `api.familypledge.org` back to Railway or restore the previous frontend API URL.
2. Keep Railway database and backend alive until OVH is stable.
3. Do not delete Railway until OVH has passed at least 24-72 hours of production traffic.
