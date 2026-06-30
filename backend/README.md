# Family Pledge — Backend

FastAPI + SQLAlchemy 2.x + Alembic + PostgreSQL backend for the Family Pledge Gaza relief platform.

---

## Requirements

- Python 3.11+
- PostgreSQL 15+

---

## Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
.venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
```

---

## Database migrations (Alembic)

All commands run from the `backend/` directory.

```bash
# Apply all migrations (bring DB up to latest)
alembic upgrade head

# Check current revision
alembic current

# View full history
alembic history --verbose

# Generate new migration after model changes
alembic revision --autogenerate -m "describe_change"

# Roll back one step
alembic downgrade -1

# Roll back everything
alembic downgrade base
```

---

## Seed first super admin

Run once after `alembic upgrade head`:

```bash
ADMIN_FULL_NAME="Your Name" \
ADMIN_EMAIL="admin@example.com" \
ADMIN_PHONE="+256700000000" \
ADMIN_PASSWORD="choose-a-strong-password" \
DATABASE_URL="postgresql://user:pass@host:5432/familypledge" \
python scripts/seed_super_admin.py
```

The script is idempotent — re-running with the same email does nothing.

---

## Run the API server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API docs: `http://localhost:8000/docs`

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/familypledge` | PostgreSQL DSN |
| `JWT_SECRET` | `change-me-in-production` | HS256 signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token lifetime (7 days) |
| `OPENAI_API_KEY` | _(empty)_ | OpenAI key for AI drafts |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:8081` | Allowed CORS origins |
| `SQL_ECHO` | `false` | Log all SQL queries |
| `CLOUDINARY_CLOUD_NAME` | _(empty)_ | Cloudinary cloud name (optional) |
| `CLOUDINARY_API_KEY` | _(empty)_ | Cloudinary API key (optional) |
| `CLOUDINARY_API_SECRET` | _(empty)_ | Cloudinary API secret (optional) |

---

## Media Storage Policy

Family Pledge keeps hosting costs near zero by never storing files on the server.

### Rules

| Media type | Where to store | Max size |
|---|---|---|
| Project images | Cloudinary | 1 MB |
| Impact card images | Cloudinary | 1 MB |
| Reminder images | Cloudinary | 1 MB |
| Contribution proof images | Cloudinary | 2 MB |
| Short videos (≤30s) | Cloudinary | 10 MB |
| Sheikh / NAMLEF talks | YouTube (unlisted) | unlimited |
| Long campaign videos | YouTube (unlisted) | unlimited |

**PostgreSQL stores only URLs and metadata — never raw files.**
**Railway disk is never used for media.**

### Accepted URL formats

- **Cloudinary**: `https://res.cloudinary.com/...` or `https://cloudinary.com/...`
- **YouTube**: `https://youtube.com/watch?v=...`, `https://youtu.be/...`, `https://youtube.com/shorts/...`

All other URL formats are rejected by the backend validator.

### Cloudinary signed upload (optional)

When `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are
configured, the admin dashboard can upload directly from the browser to Cloudinary
without routing files through this server:

```
POST /admin/storage/cloudinary-signature
Body: { "folder": "projects" | "impact" | "namlef" | "reminders" | "contribution_proofs" }
Returns: { timestamp, signature, cloud_name, api_key, upload_folder, upload_url }
```

Suggested upload folders:
- `family-pledge/projects`
- `family-pledge/impact`
- `family-pledge/namlef`
- `family-pledge/reminders`
- `family-pledge/contribution-proofs`

### Sensitivity policy

No beneficiary-identifying images should be made public without explicit admin approval.
Impact card images are only visible in the mobile app after an admin publishes the card.

---

## AI Assistant

### How to enable AI

Set `OPENAI_API_KEY` in your `.env` (or Railway environment variables):

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

When `OPENAI_API_KEY` is empty the API returns a `503` error on AI endpoints. All other
endpoints work normally without it.

### What AI can do

- Generate donor reminder drafts (Islamic tone, motivational, warm, formal)
- Generate multi-format impact updates (in-app, WhatsApp, push notification)
- Summarise internal weekly stats from the database for the admin team
- Draft motivational messages for collector circle leaders

### What AI cannot do

- Invent donation amounts, beneficiary numbers, or project results
- Fabricate Quran verses, hadiths, or their references/translations
- Issue fatwas or religious rulings
- Confirm, reject, or approve contributions
- Publish content automatically
- Access or expose personal donor data

### Human approval policy

Every AI output is saved as a **draft** (`status: draft`) and must be reviewed
and approved by an admin before any use:

1. Admin generates a draft via `/admin/ai/*` endpoint
2. Admin reviews and edits the text in the dashboard
3. Admin calls `PATCH /admin/ai/drafts/{id}/approve` — logs the approval
4. Admin calls `PATCH /admin/ai/drafts/{id}/publish` — marks as ready to use
5. Content is then manually sent/published via the notifications or reminders flow

Reject with `PATCH /admin/ai/drafts/{id}/reject` at any step.
All actions are recorded in `admin_audit_logs`.

---

## Deployment on Railway

1. Create a new Railway project and add a **PostgreSQL** plugin.
2. Add a new service from this GitHub repo, with **root directory** set to `backend/`.
3. Set all environment variables under **Variables** (copy from `.env.example`).
4. Set the **start command**:
   ```
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. After first deploy, run the seed script once via Railway's shell tab:
   ```bash
   python scripts/seed_super_admin.py
   ```
6. Railway auto-assigns a public URL — set it in your mobile/admin `CORS_ORIGINS`.

---

## Project structure

```
backend/
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py
├── app/
│   ├── main.py                    # FastAPI app + router registration
│   ├── core/
│   │   ├── config.py              # Settings (pydantic-settings)
│   │   ├── database.py            # SQLAlchemy engine + get_db()
│   │   ├── security.py            # JWT + bcrypt helpers
│   │   └── deps.py                # FastAPI dependency functions
│   ├── models/                    # SQLAlchemy ORM models (15 tables)
│   ├── schemas/                   # Pydantic v2 request/response schemas
│   ├── services/                  # Business logic layer
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── pledge_service.py
│   │   ├── contribution_service.py
│   │   ├── campaign_service.py
│   │   ├── project_service.py
│   │   ├── impact_service.py
│   │   ├── reminder_service.py
│   │   ├── namlef_service.py
│   │   ├── notification_service.py
│   │   ├── collector_service.py
│   │   └── ai_service.py
│   ├── api/
│   │   └── routes/                # FastAPI routers (one per resource)
│   └── utils/
│       ├── pagination.py
│       ├── responses.py
│       └── validators.py
├── scripts/
│   └── seed_super_admin.py
├── alembic.ini
├── requirements.txt
└── .env.example
```

---

## API overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new donor |
| POST | `/auth/login` | — | Login (phone or email) |
| GET | `/auth/me` | User | Get current user |
| POST | `/auth/save-push-token` | User | Save FCM push token |
| GET | `/users/me` | User | Get profile |
| PATCH | `/users/me` | User | Update profile |
| PATCH | `/users/me/anonymous` | User | Toggle anonymous mode |
| GET | `/users/me/badges` | User | Get earned badges |
| POST | `/pledges` | User | Create pledge |
| GET | `/pledges/me` | User | My pledges |
| GET | `/pledges/me/status` | User | Active pledge status |
| PATCH | `/pledges/{id}` | User | Pause/cancel pledge |
| POST | `/contributions/submit` | User | Submit contribution proof |
| GET | `/contributions/me` | User | My contributions |
| GET | `/contributions/me/month/{YYYY-MM}` | User | Contributions by month |
| GET | `/campaigns` | — | List campaigns |
| GET | `/campaigns/active` | — | Active campaigns |
| GET | `/campaigns/{id}` | — | Campaign detail |
| GET | `/projects` | — | List projects |
| GET | `/projects/{id}` | — | Project detail |
| GET | `/impact-cards` | — | List impact cards |
| GET | `/impact-cards/{id}` | — | Impact card detail |
| GET | `/daily-reminders` | — | Published reminders |
| GET | `/daily-reminders/today` | — | Today's reminder |
| GET | `/namlef-content` | — | Published NAMLEF content |
| GET | `/namlef-content/featured` | — | Featured content |
| GET | `/collectors/me/dashboard` | Collector | Circle stats |
| GET | `/collectors/me/members` | Collector | Circle members |
| POST | `/collectors/me/invite-code` | Collector | Get invite code |
| GET | `/admin/dashboard` | Admin | Dashboard stats |
| GET | `/admin/contributions` | Admin | All contributions |
| PATCH | `/admin/contributions/{id}/confirm` | Admin | Confirm contribution |
| PATCH | `/admin/contributions/{id}/reject` | Admin | Reject contribution |
| PATCH | `/admin/contributions/{id}/needs-follow-up` | Admin | Flag for follow-up |
| POST | `/admin/campaigns` | Admin | Create campaign |
| POST | `/admin/projects` | Admin | Create project |
| POST | `/admin/impact-cards` | Admin | Create impact card |
| POST | `/admin/daily-reminders` | Admin | Create reminder |
| PATCH | `/admin/daily-reminders/{id}/approve` | Admin | Approve reminder |
| PATCH | `/admin/daily-reminders/{id}/publish` | Admin | Publish reminder |
| POST | `/admin/namlef-content` | Admin | Create NAMLEF content |
| GET | `/admin/collectors` | Admin | List collector circles |
| POST | `/admin/collectors` | Admin | Create collector profile |
| POST | `/admin/notifications/send` | Admin | Send push notification |
| GET | `/admin/notifications` | Admin | Notification history |
| POST | `/admin/ai/reminder-draft` | Admin | Generate AI reminder |
| POST | `/admin/ai/impact-update-draft` | Admin | Generate AI impact update |
| POST | `/admin/ai/weekly-summary` | Admin | Generate weekly summary |
| POST | `/admin/ai/collector-message-draft` | Admin | Generate collector message |
| GET | `/admin/ai/drafts` | Admin | List AI drafts |
| PATCH | `/admin/ai/drafts/{id}/approve` | Admin | Approve AI draft |
| PATCH | `/admin/ai/drafts/{id}/reject` | Admin | Reject AI draft |

Full interactive docs: `http://localhost:8000/docs`
