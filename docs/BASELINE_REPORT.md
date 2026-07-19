# Production-Readiness Baseline Report

**Repository:** `Emmanuel-Bain-Oduwo/Family_Pledge_Gaza_Project`  
**Evaluation scope:** Core repository files snapshot (README, backend app/main.py, requirements.txt, alembic.ini, frontend package.json files, railway.json, vercel.json)

This report assesses the current state of the codebase exclusively from the supplied files. It does **not** examine the full source tree (e.g., `app/core/config.py`, Dockerfiles, frontend app code). The findings are therefore limited to what can be inferred.

---

## 1. Backend Health / Readiness Endpoints

The FastAPI application (`backend/app/main.py`) defines two health‑check routes:

| Endpoint | Purpose                                                       |
|----------|---------------------------------------------------------------|
| `GET /health` | Always returns 200 with static info (`status: ok`, version, environment, API prefix). |
| `GET /ready`  | Probes database connectivity and checks whether all core tables exist (`users`, `campaigns`, `projects`, `daily_reminders`, `app_settings`, `contributions`, `pledges`). Returns `ready` only when the DB is reachable **and** all tables are present; otherwise it returns `not ready` with a list of missing tables. |

Both endpoints are simple and without authentication, suitable for load‑balancer health checks. The readiness check correctly uses a try/except around engine‑level `SELECT 1` and `inspect` for table discovery.

**Current state:** Implemented and functional (assuming a reachable database and proper migrations have been run).

---

## 2. Frontend Admin Build Scripts

`frontend/admin/package.json` provides standard Next.js scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

- **`build`** → `next build` generates a production‑optimised `.next` folder.
- **`start`** → serves the production build.
- **`lint`** → `next lint` runs ESLint.

**Current state:** The scripts are present and follow the default Next.js workflow. There is no explicit `export` step because the admin is intended to be deployed to a Node.js environment (Vercel’s default). If a static site were needed, a custom script would be required.

---

## 3. Frontend Mobile Build Scripts

`frontend/mobile/package.json` has:

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "eslint . --ext .ts,.tsx",
  "build:web": "expo export --platform web",
  "preview:web": "npx serve dist"
}
```

- **`build:web`** – exports a static web bundle (output to `dist/`).
- **`preview:web`** – serves the exported web build locally.
- No native build commands (e.g., `eas build`) are defined, so the mobile app’s Android/iOS binary creation is not addressed in the provided scripts.

**Current state:** Web preview and export are covered. Native build pipeline is absent from the repository snapshot, though an Expo project typically relies on Expo Application Services (EAS) for production native builds.

---

## 4. Migrations Setup (Alembic)

- **`backend/requirements.txt`** lists `alembic==1.13.1` and `psycopg2-binary==2.9.9` (PostgreSQL driver).
- **`backend/alembic.ini`** exists and points to `script_location = alembic` (expects a `backend/alembic/` directory with `env.py`).
- The `sqlalchemy.url` in `alembic.ini` is a hard‑coded fallback:
  ```ini
  sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/familypledge
  ```
  Comment states **“override with DATABASE_URL env var in env.py”**, which is the standard practice.
- The `env.py` is **not** included in the snapshot, but assuming it follows the common pattern of `config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))`, migrations will pick up the correct production database URL.

**Current state:** Alembic is configured in principle. Migrations can be applied with `alembic upgrade head` **provided** the `DATABASE_URL` environment variable is set and the migrations directory contains the initial schema. Without the actual `env.py` and migration scripts we cannot confirm full readiness, but the infrastructure is in place.

---

## 5. Required Production Environment Variables

From the backend code (FastAPI, using `pydantic-settings`), the README snippet, and the dependencies, the following variables are essential for production:

| Variable               | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| `DATABASE_URL`         | PostgreSQL connection string (overrides hard‑coded value in `alembic.ini`). |
| `SECRET_KEY`           | Key for JWT token signing.                                                 |
| `APP_ENV`              | Should be `production`.                                                    |
| `CORS_ORIGINS`         | Comma‑separated list of allowed origins (e.g., admin dashboard URL).       |
| `OPENAI_API_KEY`       | Required only if the AI assistant feature is used (openai package included).|
| `ACCESS_TOKEN_EXPIRE_MINUTES`| JWT expiry time (default likely in `settings`).                      |
| `ALGORITHM`            | JWT algorithm (e.g., `HS256`).                                              |

For the **admin frontend** (Next.js), the live site at `https://family-pledge-gaza-project.vercel.app` needs the backend API URL, typically set via `NEXT_PUBLIC_API_URL`.

For the **mobile app**, environment variables are typically passed through `app.config.js` or `.env` files at build time (Expo `extra` fields). The snapshot does not show these.

**Important:** The `.env` example in the README is incomplete (only `APP_ENV=development`). All the variables above must be provided in the production environment, and secrets must **never** be committed.

---

## 6. Current Known Technical Risks

1. **Missing Dockerfile for Railway**  
   `railway.json` expects `backend/Dockerfile`, but it is **not** included in the snapshot. Without it, Railway cannot build the backend image.

2. **Incomplete `.env` / Environment Variables**  
   The provided README only gives a single line. Failing to set all required variables will cause the backend to crash on startup.

3. **Alembic Migrations Not Run Automatically**  
   There is no startup hook to run migrations (e.g., `alembic upgrade head` in the Docker entrypoint). This means that after deployment, the database schema may be out of sync, causing the `/ready` endpoint to report missing tables and potentially breaking API endpoints.

4. **Hardcoded SQLAlchemy URI in `alembic.ini`**  
   If `env.py` does not properly override `sqlalchemy.url` with `DATABASE_URL`, Alembic will attempt to connect to `localhost`, which will fail in any cloud environment.

5. **Minimal Security Hardening**  
   - No rate limiting or request throttling visible in the snapshot.
   - No CSRF protection (not required for a stateless API using JWT tokens, but if cookies are used in the admin, it would be a risk).
   - Security headers (e.g., `Strict-Transport-Security`, `X-Content-Type-Options`) are not added explicitly.
   - The `openai` package is included; if not carefully used, it could expose credits or leak API keys.

6. **Frontend Mobile Native Build Gap**  
   No `eas.json` or native build scripts are provided. The mobile app cannot be published to app stores without a complete EAS (or bare‑metal) pipeline.

7. **Vercel Deployment Configuration**  
   `vercel.json` specifies `installCommand` and `buildCommand` but does not set the framework to `nextjs`. For Next.js, Vercel automatically detects the framework, but the explicit `next build` command in a subdirectory might need a `rootDirectory` or a custom output directory (`frontend/admin/.next`). This may lead to misrouted assets if not correctly aligned.

8. **Database Connection String Exposure**  
   `alembic.ini` includes `localhost` credentials. While it’s common to have a fallback, it’s a risk if developers accidentally run migrations against a local DB using stale credentials.

---

## 7. Commands That Currently **Pass** (Standard Flows)

*These commands are expected to succeed **after** a proper local setup (dependencies installed and environment variables set).*

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # or venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
# After creating .env with DATABASE_URL, SECRET_KEY...
alembic upgrade head            # runs migrations (if env.py is correctly configured)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Health check: `http://localhost:8000/health` returns 200.

### Admin Frontend

```bash
cd frontend/admin
npm install
npm run build                   # generates .next production build
npm run start                   # serves on http://localhost:3000
```

### Mobile Frontend (Web Preview)

```bash
cd frontend/mobile
npm install
npx expo start --web            # launches Metro bundler and opens browser
# or
npm run build:web               # exports static files to dist/
npm run preview:web             # serves the export locally
```

All these commands are aligned with the provided `package.json` scripts and the Python requirements file.

---

## 8. Commands That Currently **Fail** and Why

| Command / Action                          | Reason for Failure                                                                                      |
|-------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `alembic upgrade head` (in a fresh clone) | `alembic.ini` points to `localhost` by default. Without overriding `DATABASE_URL` in the environment or `env.py`, it will either fail with a connection error or apply to the wrong database. |
| `uvicorn app.main:app` (without proper `.env`) | `pydantic-settings` will fail to load necessary variables like `DATABASE_URL`, `SECRET_KEY`, causing the server to crash on startup. |
| `docker build` using `railway.json` ref   | No `backend/Dockerfile` exists in the snapshot → build command fails.                                   |
| Admin production build with `vercel.json` | `vercel.json` sets `outputDirectory: "frontend/admin/.next"`, which may not align with Vercel’s expected output for Next.js (usually `framework: "nextjs"` with the root set automatically). May cause asset loading errors. |
| Mobile native build (e.g., `eas build`)    | No `eas.json` or native build configuration is present; the command is missing entirely.                |
| `npm run lint` in mobile                  | Assumes eslint config exists; if not present in the snapshot (not shown), it may fail with a missing configuration error. |
| Database readiness check (`/ready`) after first deploy | If Alembic migrations haven’t been run, the required core tables won’t exist → `/ready` returns `not ready` with missing tables, causing container orchestration failures. |

---

## Summary

The repository lays out a sound multi‑component architecture (FastAPI, Next.js admin, Expo mobile) with basic deployment configs for Railway and Vercel. However, several production‑critical pieces are either missing from the snapshot or incomplete: a production Dockerfile, automatic migration execution, a full set of environment variables, and a native mobile build pipeline. Addressing these gaps will move the project from a “works on my machine” state to a truly production‑ready deployment.