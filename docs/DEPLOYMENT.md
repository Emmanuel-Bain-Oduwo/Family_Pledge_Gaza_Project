# Deployment Guide — Family Pledge

## Production architecture

| Component | Platform | Production target |
|---|---|---|
| Backend API | OVHcloud VM + Docker Compose | `https://api.familypledgekenya.org/api/v1` |
| Reverse proxy / origin TLS | Caddy on OVH | `api.familypledgekenya.org` |
| Edge DNS / proxy | Cloudflare | Proxies the API hostname to OVH |
| Database | PostgreSQL 15 on OVH Compose | Private/internal |
| Admin dashboard | Vercel | `frontend/admin` |
| Donor web app | Vercel Expo web export | `frontend/mobile` |
| Native donor app | Expo EAS | Android + iOS |
| Public media | Cloudflare R2 | `family-pledge-media` |
| Video | Cloudflare Stream | Backend-mediated direct uploads |
| Database backups | Private Cloudflare R2 | `family-pledge-backup-db` |
| Rollback backend | Railway | Temporary fallback only |

Railway is no longer the primary deployment target. Keep it only until production data and application flows have been fully verified on OVH.

---

## 1. OVH backend

Deployment files live under:

```text
deploy/ovh/
```

The Compose stack contains:

```text
postgres
backend
caddy
```

### Configure

```bash
cd deploy/ovh
cp .env.example .env
nano .env
```

Never commit the real `.env`.

Important production values:

```env
API_DOMAIN=api.familypledgekenya.org
APP_ENV=production
API_V1_PREFIX=/api/v1
RUN_MIGRATIONS_ON_STARTUP=true
DEMO_SEED_ON_STARTUP=false
```

`RUN_MIGRATIONS_ON_STARTUP=true` is for a controlled migration/startup only. After migrations are confirmed healthy through `/ready`, set it back to `false`.

### Start

```bash
docker compose up -d --build
```

### Verify

```bash
curl -i https://api.familypledgekenya.org/health
curl -i https://api.familypledgekenya.org/ready
```

Expected API base:

```text
https://api.familypledgekenya.org/api/v1
```

---

## 2. PostgreSQL and Railway data migration

The OVH PostgreSQL service is the production target. Existing Railway data must be migrated before Railway is retired.

Export Railway PostgreSQL:

```bash
pg_dump "$RAILWAY_DATABASE_URL" | gzip > railway-familypledge.sql.gz
```

Copy to OVH:

```bash
scp railway-familypledge.sql.gz ubuntu@<OVH_SERVER_IP>:/tmp/
```

Restore:

```bash
cd ~/Family_Pledge_Gaza_Project/deploy/ovh
gunzip -c /tmp/railway-familypledge.sql.gz | docker compose exec -T postgres psql -U familypledge familypledge
docker compose exec backend alembic upgrade head
```

Then re-check:

```bash
curl -i https://api.familypledgekenya.org/ready
```

Do not delete Railway until existing admins/users and required records have been verified on OVH.

---

## 3. Admin dashboard — Vercel

Vercel project root:

```text
frontend/admin
```

Production environment variable:

```env
NEXT_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

If Next.js image optimization needs an explicit override, configure:

```env
NEXT_IMAGE_REMOTE_HOSTNAMES=familypledgekenya.org,img.youtube.com,i.ytimg.com
```

After changing public environment variables, redeploy the Vercel project because these values are injected at build time.

---

## 4. Donor web app — Vercel

The donor web app is the Expo web export from the same source tree used for native Android/iOS.

Vercel project root:

```text
frontend/mobile
```

Build settings:

```text
Build command: npm run build:web
Output directory: dist
Install command: npm install
```

Production environment variable:

```env
EXPO_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

The web build is separate from the native EAS build even though both use `frontend/mobile`.

---

## 5. Native Android and iOS — Expo EAS

The application identifiers are intentionally shared across their respective platforms:

```text
Android package: org.namlef.familypledge
iOS bundle identifier: org.namlef.familypledge
```

EAS profiles are defined in:

```text
frontend/mobile/eas.json
```

Production API:

```text
https://api.familypledgekenya.org/api/v1
```

Typical production builds:

```bash
cd frontend/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

Do not submit a store build until registration/login and the major donor flows work against the OVH API.

---

## 6. CORS

Browser clients require exact origins in the backend `CORS_ORIGINS` setting.

Current Vercel origins:

```env
CORS_ORIGINS=https://family-pledge-gaza-project.vercel.app,https://family-pledge-gaza-project-demo.vercel.app
```

Do not include URL paths such as `/login` or `/api/v1` in CORS origins.

Native Android/iOS requests do not use browser CORS in the same way.

---

## 7. Cloudflare R2 — public media

Production bucket:

```text
family-pledge-media
```

Public base URL:

```text
https://familypledgekenya.org
```

Backend-only variables:

```env
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<secret>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET_NAME=family-pledge-media
R2_PUBLIC_BASE_URL=https://familypledgekenya.org
R2_MAX_UPLOAD_MB=500
R2_ALLOWED_UPLOADS_MODE=broad
```

Do not expose R2 credentials through `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables.

Browser direct-upload flows require an R2 CORS policy allowing the intended frontend origins and required upload headers.

---

## 8. Cloudflare Stream — video

Backend-only variables:

```env
STREAM_API_TOKEN=<secret>
STREAM_CUSTOMER_CODE=<customer-code>
STREAM_MAX_DURATION_SECONDS=21600
```

The admin upload flow requests backend-mediated direct upload information, uploads the video to Stream, and confirms the upload back to the API.

Test at least one short video and one larger/resumable upload path before relying on Stream for production media.

---

## 9. Private database backups — Cloudflare R2

Production backup bucket:

```text
family-pledge-backup-db
```

This bucket must remain private and must not have a public custom domain.

Backend/backup environment:

```env
AWS_DEFAULT_REGION=auto
BACKUP_R2_ACCOUNT_ID=<cloudflare-account-id>
BACKUP_R2_ACCESS_KEY_ID=<secret>
BACKUP_R2_SECRET_ACCESS_KEY=<secret>
BACKUP_R2_BUCKET=family-pledge-backup-db
BACKUP_R2_PREFIX=db
BACKUP_KEEP_DAYS=7
```

Manual backup:

```bash
cd deploy/ovh
bash scripts/backup_db_to_r2.sh
```

A successful run uploads a `.sql.gz` object to the private bucket and removes the temporary local file.

---

## 10. Local development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Admin

```bash
cd frontend/admin
npm install
cp .env.example .env.local
npm run dev
```

### Donor mobile/web app

```bash
cd frontend/mobile
npm install
cp .env.example .env
npx expo start
```

---

## 11. Production verification

Before retiring Railway, verify:

- `/health` and `/ready` return HTTP 200.
- Existing production data is present on OVH.
- Admin login works after signing out stale pre-cutover tokens.
- Donor registration and login work through the donor web app.
- Admin and donor browser calls are visible in OVH backend logs.
- Contribution submit/review works.
- Campaign/project/impact/reminder/NAMLEF flows work.
- R2 upload works through the real UI.
- Stream video upload/playback works through the real UI.
- Private R2 database backup works.
- Android production EAS build uses OVH successfully.
- iOS production EAS build uses OVH successfully.

---

## 12. AI and email safety

The AI assistant remains backend-controlled and admin-only. Drafts/suggestions must not bypass human approval for publishing, contribution review, notifications, or other sensitive actions.

Keep weekly email delivery disabled until the provider and scheduler have been verified end-to-end:

```env
WEEKLY_EMAILS_ENABLED=false
```

---

## 13. Rollback

If a critical issue appears before the OVH migration is complete, Railway may be used as a temporary rollback target. Update the relevant frontend API environment variables and redeploy only as part of a deliberate rollback.

Do not treat Railway as the normal production path after OVH has passed the migration and acceptance checklist.
