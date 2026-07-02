# Review Report — Security, Product Flow, and Deployment

## Executive summary

The monorepo is organized as a Railway-ready FastAPI backend in `backend/`, a Vercel-ready Next.js admin dashboard in `frontend/admin/`, and an Expo mobile user app in `frontend/mobile/`. The strongest product paths already exist: donor registration/login, pledges, contribution proof submission, admin contribution review, admin push notifications, reminders, campaigns, NAMLEF content, impact cards, collectors, and AI draft generation.

This review focused on prioritized blockers rather than rewriting the product. The fixes in this change address deployment reliability, notification resilience, user email-unsubscribe readiness, production configuration guardrails, and safer auth/notification inputs.

## Priority fixes completed

1. **Railway deployment port binding**
   - The backend Docker image now respects Railway's runtime `PORT` environment variable and still falls back to `8000` locally.

2. **Railway/PostgreSQL URL compatibility**
   - The backend now normalizes `postgres://` URLs to `postgresql://` before SQLAlchemy creates the engine. This prevents deployment failures on platforms that provide the shorter scheme.

3. **Weekly email unsubscribe support**
   - Users now have a persisted weekly email opt-in flag and unique unsubscribe token.
   - Authenticated users can update their weekly email preference.
   - Public unsubscribe links can opt a user out by token.

4. **Push notification resilience**
   - Admin bulk push notification sending no longer aborts the full request when one Expo batch fails or returns invalid JSON. Failed batches are counted and the admin audit record can still be saved.

5. **Expo push project configuration**
   - The Expo project ID used to request push tokens is now configurable through environment variables instead of being hard-coded only in source.

6. **Root-level deployment config**
   - Added Railway root config and Vercel admin-scoped config so the monorepo can deploy with the intended backend/admin roots.

7. **Production configuration guardrails**
   - Production startup now rejects weak/default JWT secrets, localhost/wildcard CORS origins, missing database URLs, and incomplete SMTP settings when weekly emails are enabled.
   - Backend, admin, and mobile `.env.example` files now document the required Railway, Vercel, Expo, SMTP, OpenAI, and Cloudinary variables.

8. **Safer auth and push-token inputs**
   - Registration now requires valid email format when an email is provided, enforces 8+ character passwords, normalizes phone/email values before duplicate checks, and rejects malformed Expo push tokens before saving them.

## Current product flow

### Mobile user flow

1. User opens the Expo mobile app.
2. User registers or logs in with phone/email and password.
3. The app requests push permission and saves the Expo push token to the backend.
4. The user can view campaigns, NAMLEF content, reminders, impact updates, badges, and profile data.
5. The user can create pledges and submit contributions/proof.
6. The user can receive local reminders and backend-triggered push notifications when the app is outside the foreground, subject to OS permissions and a real Expo/EAS project configuration.

### Admin flow

1. Admin logs in to the Next.js dashboard.
2. Admin views dashboard KPIs and latest activity.
3. Admin manages campaigns, projects, reminders, NAMLEF content, impact cards, collectors, donors, and contribution review.
4. Admin can send push notifications to audiences from the notifications page.
5. Admin can use AI assistant pages to draft reminders, campaign updates, emergency appeals, impact updates, and weekly summaries.

### Backend flow

1. FastAPI exposes routes under `/api/v1` and compatibility routes without the prefix.
2. SQLAlchemy models persist users, pledges, contributions, reminders, notifications, campaigns, projects, collectors, audits, badges, AI drafts, and content.
3. Admin-only routes are protected by bearer JWT auth and role checks.
4. Alembic migrations define the PostgreSQL schema.

## Remaining prioritized recommendations

### P0 before production launch

- Add a real scheduled worker for weekly email delivery. The database opt-out model is now ready, but a scheduler/worker still needs to send weekly emails through SMTP or a transactional provider.
- Add rate limiting on auth, registration, notification, and AI endpoints.
- Add refresh-token/session revocation or shorter access-token lifetime for admin accounts.
- Add brute-force lockout or CAPTCHA on repeated failed admin logins.
- Configure production secrets only in Railway/Vercel/Expo dashboards. Do not commit `.env` files.
- Run Alembic migrations on Railway after each backend deploy.

### P1 soon after launch

- Add mobile type-checking and backend checks to CI so `npx tsc --noEmit` and backend compilation stay enforced.
- Add server-side pagination/search constraints to all admin list views.
- Add notification receipt follow-up processing for Expo tickets.
- Add audit coverage for all admin mutations.

### P2 product polish

- Add clearer onboarding explaining pledges, reminders, NAMLEF, hadith/Quran reminders, and privacy.
- Add user-visible controls for reminder frequency and notification categories.
- Add admin bulk actions and payment reconciliation dashboards.
- Add screenshots/visual regression tests once a browser is available in CI.

## Deployment notes

### Railway backend

- Root can be repository root because `railway.json` points to `backend/Dockerfile`.
- Required variables include `APP_ENV=production`, `DATABASE_URL`, a 32+ character `JWT_SECRET`, and deployed `CORS_ORIGINS`; OpenAI/Expo/SMTP/Cloudinary variables are optional unless those features are enabled.
- Run `alembic upgrade head` after deploy.

### Vercel admin frontend

- Set Vercel Root Directory to `frontend/admin`; the scoped `frontend/admin/vercel.json` runs `npm install`, `npm run build`, and outputs `.next` from that directory.
- Required variable: `NEXT_PUBLIC_API_URL=https://<railway-backend>/api/v1`.

### PostgreSQL

- The backend expects PostgreSQL in production.
- Railway-provided `postgres://` and `postgresql://` styles are both accepted now.
