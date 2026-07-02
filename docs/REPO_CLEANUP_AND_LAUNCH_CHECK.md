# Repo Cleanup and Launch Check

## Repository structure check

The repository is organized for deployment exactly as requested:

```text
backend/          FastAPI API, Alembic migrations, Dockerfile, backend env example
frontend/admin/   Next.js admin dashboard for Vercel
frontend/mobile/  Expo iOS/Android app for EAS, Play Store, and App Store
docs/             Deployment, review, screenshot proof, and handover docs
railway.json      Railway backend deployment config from repo root
vercel.json       Vercel admin deployment config from repo root
```

Frontend code is contained under `frontend/`, split into `frontend/admin/` and `frontend/mobile/`. Backend code is contained under `backend/`. The root deployment config files are intentionally kept at the repo root so Vercel and Railway can deploy from the monorepo without moving code.

## Unnecessary-file check

Checked the tracked repo for common junk/build artifacts:

- No tracked `node_modules/`
- No tracked `.next/`
- No tracked Python `__pycache__/`
- No tracked `.pyc` files
- No tracked `.DS_Store`
- No tracked `dist/` or `build/` output folders

Superseded duplicate visual report files were already removed in the previous cleanup. The remaining docs are operational docs, screenshot proof, handover docs, deployment docs, and safety/storage policies.

## Final readiness answer

The repo is clean enough to deploy today, but launch still depends on real production service setup:

1. Deploy backend on Railway.
2. Attach Railway PostgreSQL.
3. Set backend environment variables.
4. Run Alembic migrations.
5. Deploy admin on Vercel.
6. Set Vercel `NEXT_PUBLIC_API_URL` to the Railway backend API.
7. Configure Cloudinary for uploads.
8. Configure Expo/EAS credentials for iOS and Android builds.
9. Configure Firebase/FCM through Expo/EAS for Android push notifications.
10. Configure Apple push credentials through Expo/EAS for iOS notifications.
11. Add an email scheduler before enabling weekly automated emails.
12. Complete Google Play and Apple App Store metadata, privacy forms, screenshots, and review notes.

## Today launch checklist

### Railway backend

- Create Railway project.
- Add PostgreSQL service.
- Deploy backend with `railway.json` / `backend/Dockerfile`.
- Set production variables from `backend/.env.example`.
- Run `alembic upgrade head`.
- Confirm `/health` returns `{"status":"ok"}`.

### Vercel admin

- Import repo into Vercel.
- Use existing `vercel.json` or set admin build commands manually.
- Set `NEXT_PUBLIC_API_URL=https://<railway-backend>/api/v1`.
- Deploy.
- Add the Vercel domain to Railway `CORS_ORIGINS`.

### Expo mobile

- Replace placeholder EAS project ID with the real Expo project ID.
- Run `eas init` inside `frontend/mobile` if not already linked.
- Configure Android package `org.namlef.familypledge`.
- Configure iOS bundle ID `org.namlef.familypledge`.
- Configure Android FCM and iOS APNs credentials in EAS.
- Build Android and iOS using the production profile in `frontend/mobile/eas.json`.

### Email and upload services

- Set Cloudinary variables before using uploads.
- Set SMTP/provider variables before sending emails.
- Do not enable `WEEKLY_EMAILS_ENABLED=true` for real users until a weekly scheduler is implemented.
