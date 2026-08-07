# Deployment Tracker

## Production endpoints

- [x] Backend API: `https://api.familypledgekenya.org/api/v1`
- [x] Health: `https://api.familypledgekenya.org/health`
- [x] Readiness: `https://api.familypledgekenya.org/ready`
- [x] Admin Vercel project exists: `https://family-pledge-gaza-project.vercel.app`
- [x] Donor web Vercel project exists: `https://family-pledge-gaza-project-demo.vercel.app`

## OVH / database

- [x] OVH Docker Compose stack running.
- [x] PostgreSQL reachable from backend.
- [x] Current OVH migrations healthy.
- [x] Public API traffic reaches OVH through Cloudflare/Caddy.
- [ ] Required Railway production data migrated and verified on OVH.
- [ ] `RUN_MIGRATIONS_ON_STARTUP=false` confirmed after final production-data migration.

## Frontend API configuration

- [x] Repository admin API fallback updated to `https://api.familypledgekenya.org/api/v1`.
- [x] Repository admin media API fallback updated to `https://api.familypledgekenya.org/api/v1`.
- [x] Repository donor config fallback updated to `https://api.familypledgekenya.org/api/v1`.
- [x] EAS development/preview/production profiles updated to the OVH API.
- [x] `.env.example` files updated to the OVH API.
- [ ] Admin Vercel environment variable verified and redeployed.
- [ ] Donor web Vercel environment variable verified and redeployed.
- [ ] OVH CORS verified for both Vercel browser origins.

## Cloudflare media

- [x] Public R2 bucket name documented as `family-pledge-media`.
- [x] Public media base documented as `https://familypledgekenya.org`.
- [x] Admin Next.js default image host updated to `familypledgekenya.org`.
- [ ] R2 browser CORS configured and verified.
- [ ] Admin image/file upload tested end-to-end.
- [ ] Cloudflare Stream short-video upload tested end-to-end.
- [ ] Cloudflare Stream larger/resumable upload tested.

## Backups

- [x] Private backup bucket: `family-pledge-backup-db`.
- [x] Manual PostgreSQL backup uploaded successfully to private R2.
- [x] R2 AWS CLI region issue resolved with `auto`.
- [ ] Daily cron/lifecycle retention finalized.
- [ ] Restore drill performed on a safe non-production target.

## Authentication / application flows

- [ ] Existing admin login works against migrated OVH production data.
- [ ] New donor registration works from donor web.
- [ ] Donor login works from donor web.
- [ ] Contribution submit/review flow passes.
- [ ] Campaign/project/impact/reminder/NAMLEF flows pass.

## Native release

- [x] Expo/EAS config present in `frontend/mobile/eas.json`.
- [x] Android package remains `org.namlef.familypledge`.
- [x] iOS bundle identifier remains `org.namlef.familypledge`.
- [ ] Production Android EAS build tested against OVH.
- [ ] Google Play internal testing completed.
- [ ] Production iOS EAS build tested against OVH.
- [ ] TestFlight/App Store testing completed.

## Railway fallback

- [x] Railway documented as rollback/fallback only.
- [ ] Railway retired after OVH production acceptance and stability window.
