# Owner demo and deployment readiness

This project is not a rebuild. It has three deployable parts:

- `backend/` — FastAPI API for mobile and admin
- `frontend/admin/` — protected admin dashboard
- `frontend/mobile/` — Expo Android/iOS donor app

## Demo content strategy

The app should use real backend data whenever available. If the backend is empty during an owner demo, the mobile and admin frontends include safe fallback/demo content inspired by the Family Pledge website:

- pledge signup: free or USD 10/month
- awareness bags: books, videos, podcasts, comics, cards, articles, games
- projects: plant a tree, women-headed family support, children/family learning
- reminders: dua, sadaqah, Friday motivation, Palestine family awareness
- collectors: referral code, joined count, pending/confirmed members, active percentage

Fallback content must be treated as presentation/demo content and should not be presented as verified real-world delivery.

## Backend launch checklist

1. Set production environment variables:
   - `APP_ENV=production`
   - `DATABASE_URL=postgresql://...`
   - `JWT_SECRET` with 32+ random characters
   - `CORS_ORIGINS=https://your-admin-domain,https://your-mobile-web-preview-if-any`
   - optional: `OPENAI_API_KEY`, `EXPO_ACCESS_TOKEN`, SMTP, Cloudinary keys
2. Run migrations from `backend/`:
   - `alembic upgrade head`
3. Create the first protected admin:
   - use `backend/scripts/seed_super_admin.py`
4. Verify deployment probes:
   - `GET /health`
   - `GET /ready`
5. Confirm media policy:
   - store only Cloudinary/YouTube URLs in PostgreSQL
   - never store raw media files in the database

## Suggested owner-demo seed order

Use the admin dashboard or backend scripts to add:

1. Super admin
2. Daily reminders: dua, sadaqah, Friday, motivation
3. Campaigns: Sign the Family Pledge, Awareness Bags, Support Women-Headed Families
4. Projects: Awareness Bags, Plant a Tree in My Name, Children’s Palestine Learning Pack
5. Impact cards clearly marked as updates/stories, not unverifiable claims
6. NAMLEF/awareness content: who we are, what we do, why it matters, videos/articles/cards/games
7. Sample collectors and donor accounts for referral demonstrations

## Payment configuration

Mobile payment details are centralized in `frontend/mobile/constants/payment.ts` so they are not repeated across many UI files. If the owner changes bank details, update that file or replace it later with an admin-managed API settings endpoint.

Current owner-provided details include DIB Bank Kenya, NAMLEF Gaza Family Support account, M-PESA PayBill, SWIFT, bank code, and branch code.

## Remaining production tasks

- Replace demo/fallback content with verified live content in the admin dashboard.
- Connect payment settings to backend/admin-managed settings if the owner wants non-developer updates.
- Configure deployed backend URL in mobile `EXPO_PUBLIC_API_URL`.
- Add mobile ESLint config if mobile linting should be enforced in CI.
- Install backend Python dependencies in CI before import/route smoke checks.
