# Project Status

## Current architecture
- Backend API: Python service in `backend/` serving `/api/v1` routes.
- Admin web: Vercel-style web app in `frontend/admin/`.
- Mobile native app: Expo Router app in `frontend/mobile/` for Android/iOS.
- Mobile web preview: Expo static web export from `frontend/mobile` to `dist/` for Vercel preview only.

## Deployment status
- [ ] Backend production URL confirmed: `https://YOUR_DEPLOYED_BACKEND_DOMAIN/api/v1`
- [ ] Admin production Vercel URL confirmed
- [x] Mobile native app remains Expo/EAS-ready
- [x] Mobile Vercel preview configuration added

## Owner-demo readiness
- [x] Onboarding, auth, dashboard, pledge, campaigns, reminders, profile routes exist
- [x] Contribution/payment, impact updates, NAMLEF, collector circle routes exist
- [x] Demo-friendly web route aliases added
- [ ] Real production API URL must be set in Vercel

## Known blockers
- [ ] Replace placeholder backend/admin/mobile URLs with deployed URLs.
- [ ] Run a browser click-through against the deployed Vercel preview.
- [ ] Complete EAS native preview builds after owner approval.

## Next 5 actions
1. Deploy backend and confirm `/api/v1` health.
2. Set `EXPO_PUBLIC_API_URL` in mobile Vercel project.
3. Deploy mobile preview from `frontend/mobile`.
4. Run owner demo checklist end-to-end.
5. Start Android APK/EAS and Apple TestFlight preview process.
