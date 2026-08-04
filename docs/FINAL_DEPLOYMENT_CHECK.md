# Final Deployment Check and OVH/Cloudflare Launch Runbook

## Honest readiness status

The repository is close to production deployment, but the app is not fully production-ready until the external production services are configured and tested.

The current production target is:

- OVH b3-8 runs the FastAPI backend and PostgreSQL.
- Cloudflare handles DNS, SSL/security, admin/mobile web frontends, R2 file storage, and Stream video delivery.
- Railway remains a temporary fallback during migration only.

The codebase already includes the backend, database schema, auth, admin routes, mobile routes, R2 upload signing, Cloudflare Stream direct video upload, AI assistant, AI operations foundation, Expo push-token storage, admin notifications, and weekly-email opt-out data.

## Current launch blockers before real users

1. **OVH backend stack must be configured**
   - Use `deploy/ovh/docker-compose.yml` to run PostgreSQL, backend, and Caddy.
   - Copy `deploy/ovh/.env.example` to `deploy/ovh/.env` and fill real secrets on the server only.
   - Keep `RUN_MIGRATIONS_ON_STARTUP=true` for the first OVH deploy only, then change it to `false`.

2. **Production database must be migrated from Railway to OVH**
   - Export Railway PostgreSQL with `pg_dump`.
   - Restore into OVH PostgreSQL.
   - Run `alembic upgrade head`.
   - Verify `/health` and `/ready` before switching DNS.

3. **Cloudflare R2 and Stream must be configured**
   - R2 stores images, audio, PDFs, documents, and general files.
   - Cloudflare Stream handles videos.
   - Configure R2 public media bucket, custom media domain, browser CORS, and backend-only credentials.
   - Configure Stream token and customer code on the backend.

4. **Private database backups must be enabled**
   - Use a separate private Cloudflare R2 bucket such as `familypledge-db-backups`.
   - Do not attach a public custom domain to the backup bucket.
   - Run `deploy/ovh/scripts/backup_db_to_r2.sh` daily at 2 AM.
   - Keep at least 7 daily backups.

5. **AI provider must be configured**
   - AI remains admin-only, backend-mediated, and draft/suggest-only.
   - Configure the OVH GPT-OSS-120B OpenAI-compatible endpoint using:

```env
OPENAI_API_KEY=<ovh-ai-key>
OPENAI_BASE_URL=<ovh-gpt-oss-120b-openai-compatible-base-url>
OPENAI_MODEL=gpt-oss-120b
```

6. **Weekly emails are not automatic yet**
   - The app has weekly email preference/unsubscribe data.
   - A scheduler still needs to be added before weekly emails are enabled for real users.
   - Keep `WEEKLY_EMAILS_ENABLED=false` until provider and scheduler are tested.

7. **Push notifications require real Expo credentials**
   - Android push delivery needs Firebase/FCM configured through Expo/EAS credentials.
   - iOS push delivery needs Apple push credentials configured through EAS.
   - `EXPO_ACCESS_TOKEN` should be set on the backend if using Expo push API with authenticated requests.

8. **Mobile store release requires real store accounts**
   - Google Play Developer account is required for Android release.
   - Apple Developer Program account is required for iOS release.
   - Store screenshots, privacy policy, support URL, data-safety forms, and age/content ratings must be completed.

## OVH backend deployment

1. Create the OVH b3-8 instance.
2. Install Docker, Docker Compose, Git, and AWS CLI.
3. Clone the repository.
4. Go to `deploy/ovh`.
5. Copy `.env.example` to `.env`.
6. Fill production values.
7. Start the stack:

```bash
cd deploy/ovh
docker compose up -d --build
```

8. Check logs:

```bash
docker compose logs -f backend
```

9. Check local health:

```bash
curl http://127.0.0.1/health
curl http://127.0.0.1/ready
```

## Railway to OVH database migration

Keep Railway running during migration.

1. Export Railway database:

```bash
pg_dump "$RAILWAY_DATABASE_URL" | gzip > railway-familypledge.sql.gz
```

2. Copy backup to OVH:

```bash
scp railway-familypledge.sql.gz ubuntu@<OVH_SERVER_IP>:/tmp/
```

3. Restore into OVH PostgreSQL:

```bash
cd Family_Pledge_Gaza_Project/deploy/ovh
gunzip -c /tmp/railway-familypledge.sql.gz | docker compose exec -T postgres psql -U familypledge familypledge
```

4. Run migrations:

```bash
docker compose exec backend alembic upgrade head
```

5. Check readiness:

```bash
curl http://127.0.0.1/ready
```

## Cloudflare DNS cutover

After all tests pass, point:

```txt
api.familypledge.org -> OVH public IP
```

Then test:

```bash
curl https://api.familypledge.org/health
curl https://api.familypledge.org/ready
```

Keep Railway alive for 24-72 hours after cutover.

## Required production tests before deleting Railway

- `/health` returns `status: ok`.
- `/ready` returns `status: ready`.
- Admin login works.
- Donor login/register works.
- Contribution submission works.
- Admin contribution review works.
- Campaign create/update/list works.
- Project create/update/list works.
- Impact card create/update/list works.
- Daily reminder create/publish works.
- NAMLEF content create/update/list works.
- R2 image/document upload works.
- Cloudflare Stream video upload works.
- AI weekly summary works.
- AI reminder/impact/collector draft creation works.
- AI scheduled task run-now creates a reviewable task run only.
- Admin/mobile web frontends use `https://api.familypledge.org/api/v1`.

## Cloudflare R2 setup

1. Create a public media R2 bucket, e.g. `familypledge-media`.
2. Create a bucket-limited R2 API token.
3. Attach public custom domain, e.g. `media.familypledge.org`.
4. Set `R2_PUBLIC_BASE_URL=https://media.familypledge.org`.
5. Configure bucket CORS for admin origins and `PUT` with `Content-Type` and `Cache-Control` headers.
6. Put account ID, access key, and secret only in the backend environment.
7. Verify uploads from the admin dashboard.
8. Monitor final billing truth in Cloudflare.

## Cloudflare Stream setup

1. Enable Stream in the same Cloudflare account.
2. Create a backend-only API token with Stream write permission.
3. Copy the Stream customer code.
4. Configure `STREAM_API_TOKEN`, `STREAM_CUSTOMER_CODE`, and `STREAM_MAX_DURATION_SECONDS` on OVH backend.
5. Verify video upload and playback from admin/user interface.

## Private DB backup setup

Use a separate private bucket, for example:

```txt
familypledge-db-backups
```

Run manually first:

```bash
cd deploy/ovh
bash scripts/backup_db_to_r2.sh
```

Add daily cron after manual backup passes:

```cron
0 2 * * * cd /home/ubuntu/Family_Pledge_Gaza_Project/deploy/ovh && bash scripts/backup_db_to_r2.sh >> /var/log/familypledge-db-backup.log 2>&1
```

Restore example:

```bash
cd deploy/ovh
RESTORE_CONFIRM=YES bash scripts/restore_db_from_backup.sh db/familypledge-2026-08-04T02-00-00Z.sql.gz
```

## Frontend deployment

Admin and mobile web can be deployed to Cloudflare Pages or kept temporarily on Vercel during cutover. In either case, the public API URL must be:

```env
NEXT_PUBLIC_API_URL=https://api.familypledge.org/api/v1
EXPO_PUBLIC_API_URL=https://api.familypledge.org/api/v1
```

## AI safety and database access

AI must never receive raw database credentials. AI accesses platform data only through backend services and admin-only routes. It may read controlled summaries and create drafts/suggestions, but it must not directly send notifications, approve/reject contributions, delete donors, or mutate critical records without explicit admin action.

## Final go/no-go answer

- **Backend**: OVH-ready after `.env`, PostgreSQL, migrations, Caddy, DNS, and readiness tests pass.
- **Database**: migrate from Railway to OVH PostgreSQL, then enable daily private R2 backups.
- **Uploads**: ready after R2 variables, custom domain, CORS, and admin upload tests pass.
- **Videos**: ready after Stream token/customer code and playback tests pass.
- **AI**: foundation exists; configure OVH GPT-OSS-120B endpoint and keep admin-approval gate.
- **Railway**: keep as fallback for 24-72 hours; delete only after OVH is stable.
- **Emails**: not launch-ready for weekly automated emails until a scheduler is implemented.
- **Mobile stores**: build-ready after real EAS/store credentials; store release still needs metadata and privacy forms.
