# Production Hardening Audit

## Summary verdict

**controlled-pilot ready**

The application core flows (registration, login, contribution viewing, admin dashboard, mobile web preview) are functional and stable for a controlled pilot. However, essential production-grade security, observability, backup, testing, and CI practices are either missing or incomplete. Real source code implementations for rate limiting, password reset, audit logging, duplicate protection, and monitoring do not exist—only placeholder docs or removed CI steps. The CI workflow has been restored but uses `|| true` hacks and lacks proper testing. Therefore, the project is not yet production-ready and must not be deployed to a public production environment until the blockers below are resolved.

## Current working state

The following features work as observed in the repository snapshot and previous testing:

- Backend health and readiness endpoints (`/health`, `/ready`)
- Admin login and dashboard loading (API URL correctly mapped)
- Admin dashboard statistics and recent audit log display
- Normal user registration and login (identifier mapping implemented)
- Mobile web preview via Expo web export
- Mobile web refresh 404 handled by Vercel SPA rewrites
- Contribution submission/review flows appear functional (though review audit logging missing)
- Notifications system likely functional (previous crash fixes addressed)
- Backend authentication middleware and role-based access control intact

## Production hardening checklist

| Area | Status | Evidence | Action needed |
|---|---|---|---|
| GitHub Actions CI | partially implemented | `.github/workflows/ci.yml` present but uses `|| true` in backend compile step; no pytest, no lint for admin/mobile, no database migration test. | Remove `|| true`; add `pytest`; add `alembic upgrade head` with PostgreSQL service; add linting steps where configured. |
| Backend tests | missing | No `tests/` directory or test files visible in snapshot; CI only runs `compileall`. | Write real pytest tests for auth, contributions, audit logging, rate limiting, password reset. |
| Admin frontend build/typecheck | partially implemented | CI runs `npx tsc --noEmit` and `npm run build` (Next.js). | Already passing; ensure lint step (`npm run lint`) is added if config is present. |
| Mobile web build/typecheck/lint | partially implemented | CI runs `npm run build:web` but no TypeScript type check or lint. | Add `npx tsc --noEmit` if tsconfig available; add `npm run lint` if script exists. |
| Auth rate limiting | missing | No rate limiting middleware or dependency in `auth.py`; `rate_limit.py` file missing entirely. | Implement real in‑memory rate limiter in `backend/app/core/rate_limit.py` and apply to login/register routes. |
| Password reset backend endpoints | missing | No `/auth/password-reset/request` or `/confirm` routes present. | Add endpoints, new database migration for tokens, secure token generation, hashing, expiry. |
| Password reset frontend UI | missing | No "Forgot password" link or reset pages visible in either admin or mobile frontend. | Build forgot password, request and confirm screens for both admin (Next.js) and mobile (Expo). |
| Contribution review audit logging | missing | `admin.py` shows reading of `AdminAuditLog`, but no write logic during contribution review is visible. Likely no logging of status changes. | Implement audit logging in the contribution review endpoint (confirm/reject/needs_follow_up) using the existing `admin_audit_logs` table. |
| Duplicate transaction reference protection | missing | No validation against duplicate references observed; contributions likely accept any reference. | Add normalization and duplicate check before saving contributions; reject with 400 if same user repeats a reference. |
| Sentry/error monitoring | missing | No Sentry SDK import or initialization in any project; no environment variables for DSN. | Integrate Sentry (optional via env var) in backend, admin, and mobile; scrub sensitive data. |
| Production smoke test script | implemented | `scripts/smoke_test_production.py` exists and checks health, ready, admin URL, mobile URL. | Already present; optionally extend with login and `/auth/me` if credentials are provided. |
| Backup/restore docs | missing | No documentation for database backup, restore drill, or safe migration procedures. | Create `docs/DATABASE_BACKUP_RESTORE.md` with practical steps for PostgreSQL backups and restoration. |
| Demo seed production guard | missing | No seed script visible; missing `scripts/seed_demo_content.py`; only a docs mention. | Implement guard: refuse to run seed in `production` unless `ALLOW_DEMO_SEED_IN_PRODUCTION=true`. |
| Release QA checklist | missing | No structured QA document exists. | Create `docs/RELEASE_QA_CHECKLIST.md` covering all user/admin flows, operational checks, and deployment verification. |
| Removal of temporary agent scripts | unknown | No temporary scripts (`run_phase*.py`, patch files) visible in current snapshot. | Verify none remain in the full repository; if any exist, delete them and update misleading docs. |
| Absence of secrets in current working tree | clean | No secret values (keys, tokens, passwords) found in the provided files. | Continue to scan for secrets in all files; if any are found, rotate immediately and add to `.gitignore`. |
| Evidence of possible secrets in Git history | likely | The problem statement indicates agent scripts may have contained provider API keys in history. | Rotate all possibly exposed keys (AI provider, Railway, Cloudinary, JWT, SMTP, DB); follow secret rotation guide. |

## Current blockers before production

1. **No real rate limiting** – Login/register endpoints are unprotected against brute‑force attacks.
2. **No password reset** – Users locked out cannot recover access; support burden will be high.
3. **Missing audit logging for contribution review** – Admin actions are not traceable; compliance risk.
4. **No duplicate transaction protection** – Could lead to double‑counting or fraud.
5. **No backend tests** – No safety net for regressions; CI cannot verify correctness.
6. **CI uses error‑hiding `|| true`** – Real failures (e.g., import errors) are ignored.
7. **No error monitoring** – No centralized logging/Sentry to detect production incidents.
8. **No backup/restore documentation** – Inability to perform disaster recovery drills.
9. **Potential secret exposure in Git history** – Requires immediate rotation of all keys used during development.
10. **Demo seed can run in production if misconfigured** – Risk of resetting or duplicating users/data.

## Immediate safe next steps

1. **Create PR 1**: Restore a healthy CI pipeline (remove `|| true`, add pytest, add migration test, add lint where available).
2. **Create PR 2**: Implement real auth rate limiting with tests.
3. **Create PR 3**: Implement password reset backend (with migration and tests).
4. **Create PR 4**: Add password reset UI for admin and mobile.
5. **Create PR 5**: Add contribution review audit logging.
6. **Create PR 6**: Protect against duplicate contribution references.
7. **Create PR 7**: Integrate optional Sentry monitoring.
8. **Create PR 8**: Harden demo seed production guard.
9. **Create PR 9**: Write backup/restore docs and production runbook.
10. **Create PR 10**: Finalise release QA checklist and validate all steps.

After all PRs are merged, run the full test suite and smoke tests, then proceed to a controlled production launch.

## Secret exposure note

- **No obvious secrets found in the current working tree** (based on the files provided).
- **Possible historical exposure** exists: earlier agent‑generated scripts may have contained provider API keys or other secrets in Git history. These must be considered compromised.
- **Rotate all affected keys immediately**: AI provider keys (OpenAI, DeepSeek, etc.), Railway tokens, database passwords, JWT secret, SMTP credentials, Cloudinary credentials, and any other credentials used during development.
- **Do not simply delete the files** – Git history retains them. Consider enabling GitHub secret scanning and, if necessary, rewrite history with extreme care after rotation.
- **Document the rotation process** in `docs/SECRET_ROTATION.md` (to be created in a follow‑up PR).