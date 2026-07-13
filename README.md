# Family Pledge Gaza Project

Family Pledge is a simple donation and pledge platform for supporting families in Gaza.

The idea is straightforward:

People can register, make a monthly pledge, submit their contribution proof, and receive reminders and updates. Admins can manage donors, contributions, campaigns, projects, reminders, content, and notifications from a web dashboard.

This project has three main parts:

- a backend API
- an admin web dashboard
- a donor mobile app

The goal is not to build something complicated. The goal is to build something useful, clear, and maintainable.

---

## Project structure

```txt
Family_Pledge_Gaza_Project/
├── backend/
├── frontend/
│   ├── admin/
│   └── mobile/
└── docs/
````

### Backend

The backend is a FastAPI application.

It handles:

* user registration and login
* admin authentication
* donor records
* pledges
* contribution submissions
* admin contribution review
* campaigns
* projects
* impact updates
* daily reminders
* NAMLEF awareness content
* push notifications
* app settings
* database migrations

Main technologies:

* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* JWT authentication
* Railway deployment

---

### Admin web dashboard

The admin dashboard is a Next.js web app.

It is used by the project team to manage the system.

Admins can:

* view dashboard stats
* manage donors
* review contributions
* manage campaigns
* manage projects
* publish impact updates
* create daily reminders
* manage awareness content
* send notifications
* update app settings
* update their own admin profile

Main technologies:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Axios
* Vercel deployment

The admin is a website. It should work on desktop, tablet, and mobile browsers.

---

### Mobile app

The mobile app is built with Expo and React Native.

It is for donors and participants.

Users can:

* register
* pledge monthly support
* view campaigns and projects
* submit contribution proof
* receive reminders
* read awareness content
* see impact updates

Main technologies:

* Expo
* React Native
* TypeScript
* Expo Router

---

## Current live services

Backend API:

```txt
https://familypledgegazaproject-production.up.railway.app/api/v1
```

Backend health check:

```txt
https://familypledgegazaproject-production.up.railway.app/health
```

Admin dashboard:

```txt
https://family-pledge-gaza-project.vercel.app
```

Mobile web preview:

```txt
https://family-pledge-gaza-project-demo.vercel.app
```

---

## Local development

### 1. Clone the repository

```bash
git clone https://github.com/Emmanuel-Bain-Oduwo/Family_Pledge_Gaza_Project.git
cd Family_Pledge_Gaza_Project
```

---

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell:

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`.

Example:

```env
APP_ENV=development
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/familypledge
JWT_SECRET=change-this-to-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
SQL_ECHO=false
```

Run migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Health check:

```txt
http://localhost:8000/health
```

API base:

```txt
http://localhost:8000/api/v1
```

---

## Admin setup

```bash
cd frontend/admin
npm install
```

Create `.env.local` inside `frontend/admin/`.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start the admin app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

For production, use:

```env
NEXT_PUBLIC_API_URL=https://familypledgegazaproject-production.up.railway.app/api/v1
```

---

## Mobile app setup

```bash
cd frontend/mobile
npm install
```

Create `.env` inside `frontend/mobile/`.

Example:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start Expo:

```bash
npx expo start
```

For production, use:

```env
EXPO_PUBLIC_API_URL=https://familypledgegazaproject-production.up.railway.app/api/v1
```

---

## Database migrations

Alembic is used for database migrations.

Run migrations:

```bash
cd backend
alembic upgrade head
```

Create a new migration only when the database schema changes.

Example:

```bash
alembic revision -m "describe change"
```

Then edit the generated migration file carefully.

Do not use `Base.metadata.create_all()` in production.

---

## Demo seed

The backend can seed demo content when enabled.

Useful environment variables:

```env
DEMO_SEED_ON_STARTUP=true
DEMO_ADMIN_EMAIL=demo.admin@familypledge.org
DEMO_ADMIN_PHONE=+254700000001
DEMO_ADMIN_PASSWORD=ChangeMeDemo123!
```

Important note:

If an admin already exists, the seed script may reuse the existing admin. It does not always reset the password. This is intentional to avoid overwriting real admin credentials.

---

## Authentication

The backend uses JWT access tokens.

Login path:

```txt
POST /api/v1/auth/login
```

Current user path:

```txt
GET /api/v1/auth/me
```

Admin routes are protected. Only users with the admin role should access the admin dashboard.

The project uses a single admin role:

```txt
admin
```

There should be no separate production behavior for `super_admin`.

---

## CORS

The backend only accepts requests from origins listed in `CORS_ORIGINS`.

Example for production:

```env
CORS_ORIGINS=https://family-pledge-gaza-project.vercel.app,https://family-pledge-gaza-project-demo.vercel.app
```

Do not include paths like `/login` or `/api/v1`.

Correct:

```txt
https://family-pledge-gaza-project.vercel.app
```

Wrong:

```txt
https://family-pledge-gaza-project.vercel.app/login
```

Every Vercel deployment URL is a different origin. If you open a random deployment URL, the browser may block requests because of CORS.

---

## Deployment

### Backend

The backend is deployed on Railway.

Recommended Railway settings:

```env
APP_ENV=production
API_V1_PREFIX=/api/v1
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<long-random-secret>
CORS_ORIGINS=https://family-pledge-gaza-project.vercel.app,https://family-pledge-gaza-project-demo.vercel.app
RUN_MIGRATIONS_ON_STARTUP=true
DEMO_SEED_ON_STARTUP=true
```

After a stable production deploy, demo seeding and automatic migrations can be disabled if no longer needed.

---

### Admin

The admin dashboard is deployed on Vercel.

Root directory:

```txt
frontend/admin
```

Environment variable:

```env
NEXT_PUBLIC_API_URL=https://familypledgegazaproject-production.up.railway.app/api/v1
```

---

### Mobile web preview

The mobile preview is deployed separately on Vercel.

Root directory:

```txt
frontend/mobile
```

Environment variable:

```env
EXPO_PUBLIC_API_URL=https://familypledgegazaproject-production.up.railway.app/api/v1
```

---

## Important API paths

```txt
POST  /api/v1/auth/login
GET   /api/v1/auth/me
PATCH /api/v1/users/me

GET   /api/v1/admin/dashboard
GET   /api/v1/admin/donors
GET   /api/v1/admin/contributions
PATCH /api/v1/admin/contributions/{id}/review

GET   /api/v1/admin/notifications
POST  /api/v1/admin/notifications/send

GET   /api/v1/campaigns
GET   /api/v1/projects
GET   /api/v1/impact-cards
GET   /api/v1/daily-reminders
GET   /api/v1/namlef-content
```

---

## Development rules

Keep the project simple.

When fixing a bug:

1. Identify the real failing endpoint or component.
2. Make the smallest safe change.
3. Avoid touching unrelated files.
4. Do not redesign working parts.
5. Do not change API URLs unless the bug is actually the URL.
6. Do not change auth unless the bug is actually auth.
7. Do not change database migrations unless the bug is actually the database schema.

A good pull request should have a clear purpose and a small diff.

---

## Testing

Backend checks:

```bash
cd backend
python -m compileall app scripts tests
```

Frontend admin checks:

```bash
cd frontend/admin
npm run build
npx tsc --noEmit
```

Mobile checks:

```bash
cd frontend/mobile
npx expo start
```

Before pushing:

```bash
git diff --check
git status
```

---

## Security notes

Do not commit secrets.

Never commit:

* database passwords
* JWT secrets
* API keys
* SMTP passwords
* Cloudinary secrets
* admin passwords
* password hashes

Public frontend variables such as `NEXT_PUBLIC_API_URL` and `EXPO_PUBLIC_API_URL` are visible in the browser. They are not secrets.

If a secret is accidentally exposed, rotate it.

---

## Project status

This project is under active development.

The current focus is:

* stable admin dashboard
* safe contribution review
* clean mobile donor experience
* reliable backend migrations
* simple deployment on Railway and Vercel
* responsive admin website for desktop and mobile browsers

---

## License

This project is maintained for the Family Pledge Gaza initiative.

Use responsibly.

```
```
