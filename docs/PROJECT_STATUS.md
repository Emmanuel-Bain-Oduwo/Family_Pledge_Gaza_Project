# Project Status

## Current architecture

- Backend API: FastAPI in `backend/`, deployed on OVH through Docker Compose.
- Database: PostgreSQL 15 in the OVH Compose stack.
- Reverse proxy/origin TLS: Caddy on OVH.
- DNS/edge proxy: Cloudflare.
- Admin web: Next.js in `frontend/admin/`, currently deployed on Vercel.
- Donor native app: Expo Router app in `frontend/mobile/` for Android/iOS through EAS.
- Donor web app: Expo static web export from `frontend/mobile/`, currently deployed on Vercel.
- Public media: Cloudflare R2 bucket `family-pledge-media`.
- Video: Cloudflare Stream.
- Database backups: private R2 bucket `family-pledge-backup-db`.
- Railway: temporary rollback/fallback only.

## Confirmed production infrastructure

- [x] Production API domain: `https://api.familypledgekenya.org/api/v1`
- [x] Public `/health` returns HTTP 200.
- [x] Public `/ready` returns HTTP 200 with database connected and migrations healthy on the current OVH database.
- [x] Cloudflare proxies the API hostname to OVH.
- [x] Caddy serves valid origin HTTPS for `api.familypledgekenya.org`.
- [x] Manual PostgreSQL backup to private R2 succeeded.
- [x] EAS configuration exists for Android/iOS.
- [x] Expo web/Vercel configuration exists.

## Remaining production verification

- [ ] Migrate/verify required Railway production data on OVH PostgreSQL.
- [ ] Existing admin login works against OVH after production-data migration and fresh login.
- [ ] Donor registration and login work through the donor web UI against OVH.
- [ ] Admin Vercel deployment uses `NEXT_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1`.
- [ ] Donor web Vercel deployment uses `EXPO_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1`.
- [ ] Backend CORS allows both actual Vercel browser origins.
- [ ] Admin image/file upload works end-to-end with R2.
- [ ] Admin video upload/playback works end-to-end with Cloudflare Stream.
- [ ] Contribution submission/review works against OVH.
- [ ] Campaign/project/impact/reminder/NAMLEF flows pass against OVH.
- [ ] Android production EAS build tested on a real device.
- [ ] iOS production EAS build tested on a real device.
- [ ] Google Play internal testing completed.
- [ ] Apple TestFlight/App Store testing completed.

## Immediate next actions

1. Merge the OVH runtime/config cleanup PR.
2. Redeploy the admin and donor-web Vercel projects with the OVH API environment variables.
3. Migrate required Railway production data to OVH and re-test admin/donor authentication.
4. Test R2 and Stream through the real admin UI.
5. Build and test the Android production EAS artifact, then proceed to Play Store internal testing.
6. Repeat the native verification for iOS/TestFlight.

## Retirement condition for Railway

Do not shut down Railway until the production data is present on OVH and all critical admin, donor, contribution, media, and native-app paths have passed. After a deliberate stability window and verified OVH backups, Railway can be retired.
