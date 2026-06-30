# Deployment Guide — Family Pledge for Gaza

## Overview

| Component | Platform | URL |
|-----------|----------|-----|
| Backend API | Railway | https://api.familypledge.org/api/v1 |
| Admin Dashboard | Vercel | https://admin.familypledge.org |
| Mobile App | Expo EAS / App Stores | — |
| Database | Railway PostgreSQL | (internal) |
| Media Storage | Cloudinary | Free tier |

---

## 1. Backend — Railway

### Prerequisites

- Railway account at https://railway.app
- PostgreSQL plugin added to your Railway project
- Repository connected to Railway

### Steps

1. Create a new Railway project
2. Add a **PostgreSQL** plugin — Railway will set `DATABASE_URL` automatically
3. Connect your GitHub repository
4. Set the **Root Directory** to `backend/`
5. Railway auto-detects the `Dockerfile` in `backend/`
6. Set environment variables (see below)
7. Deploy

### Environment Variables (Railway)

```
DATABASE_URL=<auto-set-by-railway-postgres-plugin>
JWT_SECRET=<generate-with-python-secrets.token_hex(32)>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGINS=https://admin.familypledge.org,https://familypledge.org,exp://localhost:8081
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
SQL_ECHO=false
```

### Database Migrations

After first deploy, run Alembic migrations via Railway shell:

```bash
cd /app
alembic upgrade head
```

### Health Check

```
GET https://api.familypledge.org/health
→ {"status": "ok", "version": "1.0.0"}
```

---

## 2. Admin Dashboard — Vercel

### Prerequisites

- Vercel account at https://vercel.com
- GitHub repository connected

### Steps

1. Import your GitHub repo in Vercel
2. Set **Root Directory** to `frontend/admin`
3. Set **Framework Preset** to Next.js
4. Set environment variables (see below)
5. Deploy

### Environment Variables (Vercel)

```
NEXT_PUBLIC_API_URL=https://api.familypledge.org/api/v1
```

### Admin User Setup

After backend deploys and migrations run, create the first admin user via the Railway shell:

```python
# Run in Railway shell: cd /app && python
from app.core.database import SessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password

db = SessionLocal()
admin = User(
    full_name="Admin",
    email="admin@familypledge.org",
    phone="+0000000000",
    password_hash=hash_password("change-this-password"),
    role=UserRole.super_admin,
    anonymous_publicly=False,
    is_active=True,
    country="Kenya",
)
db.add(admin)
db.commit()
print("Admin created:", admin.id)
db.close()
```

---

## 3. Mobile App — Expo EAS

### Prerequisites

- Expo account at https://expo.dev
- EAS CLI: `npm install -g eas-cli`
- `eas.json` configured in `frontend/mobile/`

### Environment Setup

Create `frontend/mobile/.env` (not committed):

```
EXPO_PUBLIC_API_URL=https://api.familypledge.org/api/v1
```

### Development

```bash
cd frontend/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

### Production Build (EAS)

```bash
cd frontend/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

### OTA Updates

```bash
eas update --branch production --message "Fix: greeting and API routes"
```

---

## 4. Cloudinary Setup (Free Tier)

1. Sign up at https://cloudinary.com (free tier is sufficient for Phase 1)
2. Go to **Settings → Upload → Upload Presets** — no preset needed (signed upload)
3. Copy your **Cloud Name**, **API Key**, and **API Secret**
4. Set them in Railway environment variables

### Folder Structure in Cloudinary

```
family-pledge/
├── projects/     ← project cover images
├── reminders/    ← reminder images
├── namlef/       ← NAMLEF content thumbnails
└── impact/       ← impact card images
```

---

## 5. Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Admin Dashboard

```bash
cd frontend/admin
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

### Mobile App

```bash
cd frontend/mobile
npm install
cp .env.example .env
# Edit .env
npx expo start
```

---

## 6. CORS Configuration

The backend `CORS_ORIGINS` must include all frontend origins:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,https://admin.familypledge.org,exp://192.168.x.x:8081
```

For Expo development, add your local network IP (`exp://192.168.x.x:8081`).

---

## 7. Post-Deployment Checklist

- [ ] `GET /health` returns 200
- [ ] Admin can log in at admin.familypledge.org
- [ ] Mobile app connects to API (check network logs)
- [ ] `/dashboard` returns data for a logged-in user
- [ ] Cloudinary upload works (test via Admin → Impact Cards → Upload Image)
- [ ] Push notifications sent (test via Admin → Notifications → Send)
- [ ] AI assistant responds (test via Admin → AI Assistant)
- [ ] Alembic migrations applied (`alembic current` shows head)
