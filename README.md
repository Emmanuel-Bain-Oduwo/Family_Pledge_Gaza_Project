# Family Pledge Gaza Project

Family Pledge is a donation and pledge platform for supporting families in Gaza. The platform includes a backend API, an admin dashboard, and a donor application delivered as both native Android/iOS builds and an Expo web build.

## Repository structure

```text
Family_Pledge_Gaza_Project/
├── backend/                 # FastAPI + PostgreSQL/Alembic application
├── deploy/ovh/              # Production OVH Docker Compose deployment
├── frontend/
│   ├── admin/               # Next.js admin dashboard
│   └── mobile/              # Expo donor app: Android, iOS, and web
├── docs/                    # Deployment, operations, and handover docs
└── scripts/
```

## Production architecture

```text
Admin Vercel ───────────────┐
                            │
Donor web Vercel ───────────┼──> Cloudflare ──> OVH Caddy ──> FastAPI ──> PostgreSQL
                            │
Android / iOS EAS builds ───┘

FastAPI ──> Cloudflare R2      (images/files)
FastAPI ──> Cloudflare Stream  (video)
OVH backup script ──> private R2 bucket
```

### Production services

| Component | Current target |
|---|---|
| API | `https://api.familypledgekenya.org/api/v1` |
| Health | `https://api.familypledgekenya.org/health` |
| Readiness | `https://api.familypledgekenya.org/ready` |
| Backend | OVHcloud VM, Docker Compose |
| Database | PostgreSQL 15 on OVH |
| API edge/DNS | Cloudflare |
| Admin | Vercel (`frontend/admin`) |
| Donor web | Vercel Expo web (`frontend/mobile`) |
| Native donor app | Expo EAS, Android + iOS |
| Public media | Cloudflare R2 bucket `family-pledge-media` |
| Video | Cloudflare Stream |
| DB backups | Private R2 bucket `family-pledge-backup-db` |
| Railway | Temporary rollback/fallback only |

Railway should not be treated as the normal production API after the OVH migration is accepted.

## Backend

The backend is a FastAPI application with PostgreSQL, SQLAlchemy, Alembic, and JWT authentication.

It handles:

- donor registration/login;
- admin authentication and protected admin routes;
- pledges and contributions;
- contribution review;
- campaigns and projects;
- impact cards;
- reminders and NAMLEF content;
- collectors;
- notification records/push-token registration;
- media upload orchestration;
- Cloudflare R2 and Stream integration;
- AI draft/operations endpoints;
- settings and operational readiness.

### Important API paths

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
GET  /api/v1/users/me

GET  /api/v1/admin/dashboard
GET  /api/v1/admin/donors
GET  /api/v1/admin/contributions

GET  /api/v1/campaigns
GET  /api/v1/projects
GET  /api/v1/impact-cards
GET  /api/v1/daily-reminders
GET  /api/v1/namlef-content
```

Health/readiness are intentionally outside the API prefix:

```text
GET /health
GET /ready
```

## Admin dashboard

The admin dashboard is a Next.js application in `frontend/admin`.

Production API environment variable:

```env
NEXT_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

The source fallback is also set to the OVH production API so a missing Vercel variable cannot silently send traffic to the old backend.

Production media images use the configured Cloudflare R2 public hostname. The admin media client requests upload instructions from the backend, then uploads to R2 or Cloudflare Stream as appropriate.

## Donor app: web + Android + iOS

The donor application lives in `frontend/mobile` and has two deployment paths.

### Expo web on Vercel

```env
EXPO_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

Vercel builds the static web export with `npm run build:web`.

### Native Expo/EAS

`frontend/mobile/eas.json` configures development, preview, and production builds to use:

```text
https://api.familypledgekenya.org/api/v1
```

Application identifiers:

```text
Android package: org.namlef.familypledge
iOS bundle identifier: org.namlef.familypledge
```

Native production builds:

```bash
cd frontend/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

Do not submit store builds until registration/login and the main donor flows pass against OVH.

## OVH production deployment

The production backend runbook is:

```text
deploy/ovh/README.md
```

Basic startup:

```bash
cd deploy/ovh
cp .env.example .env
# fill real secrets locally on the server
docker compose up -d --build
```

Public checks:

```bash
curl -i https://api.familypledgekenya.org/health
curl -i https://api.familypledgekenya.org/ready
```

After controlled migrations are complete and `/ready` reports healthy migrations, set:

```env
RUN_MIGRATIONS_ON_STARTUP=false
```

## Cloudflare media

### Public R2 media

```text
Bucket: family-pledge-media
Public base: https://familypledgekenya.org
```

R2 credentials remain backend-only. Browser direct uploads require the appropriate R2 CORS policy.

### Stream

Videos use Cloudflare Stream through backend-mediated direct-upload endpoints. Stream secrets remain backend-only.

## Database backups

Database backups use a separate private R2 bucket:

```text
family-pledge-backup-db
```

The backup bucket has no public base URL and must remain private.

Manual backup:

```bash
cd deploy/ovh
bash scripts/backup_db_to_r2.sh
```

Cloudflare R2 AWS CLI configuration should use a valid R2 region such as:

```env
AWS_DEFAULT_REGION=auto
```

## Railway migration/fallback

Railway remains only while production data is being migrated and verified. See:

```text
docs/RAILWAY_RUNBOOK.md
```

Before retiring Railway:

- migrate required production database records to OVH;
- verify existing admin login against OVH;
- verify donor registration/login;
- verify contribution and content flows;
- verify R2/Stream uploads;
- verify private DB backups;
- verify both Vercel frontends use OVH;
- verify Android/iOS release builds use OVH.

## Local development

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

### Donor app

```bash
cd frontend/mobile
npm install
cp .env.example .env
npx expo start
```

## Testing

Backend syntax/compile check:

```bash
cd backend
python -m compileall app scripts tests
```

Admin checks:

```bash
cd frontend/admin
npm run build
npx tsc --noEmit
```

Mobile checks:

```bash
cd frontend/mobile
npm run lint
npm run build:web
```

Before merging:

```bash
git diff --check
git status
```

## Security rules

Never commit:

- database passwords;
- JWT secrets;
- API keys/tokens;
- R2 access keys/secrets;
- Stream API tokens;
- SMTP passwords;
- admin passwords;
- password hashes.

Public frontend API URLs such as `NEXT_PUBLIC_API_URL` and `EXPO_PUBLIC_API_URL` are not secrets.

AI endpoints remain backend-mediated and should stay draft/suggest-only for sensitive operational actions. Human review is required before publishing content or taking sensitive admin actions.

## Key documentation

```text
docs/DEPLOYMENT.md             # current production architecture/deployment
docs/ENV_MATRIX.md             # environment variable ownership/values
docs/FINAL_DEPLOYMENT_CHECK.md # acceptance checklist and remaining blockers
docs/HANDOVER_GUIDE.md         # admin/operator guide
deploy/ovh/README.md            # OVH server runbook
docs/RAILWAY_RUNBOOK.md        # temporary fallback/legacy runbook
```

## Current focus

The immediate launch work is to finish production-data migration, verify admin/donor authentication against OVH, test R2 and Stream through the real UI, then produce and test Android/iOS EAS release builds before store submission.
