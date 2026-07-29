# Final Deployment Check and Launch Runbook

## Honest readiness status

The repository is close to deployable, but the app is **not fully production-ready until the external production services are configured**. The codebase has the frontend, backend, database schema, auth, admin routes, mobile routes, R2 upload signing, Expo push-token storage, admin notifications, and weekly-email opt-out data. The remaining launch blockers are operational setup items: Railway variables, Railway PostgreSQL migrations, Cloudflare R2, Expo/EAS credentials, store accounts, app privacy metadata, and an email scheduler/provider.

## Final checks completed in this pass

- Removed superseded duplicate visual report files so the docs folder is cleaner.
- Added `frontend/mobile/eas.json` so Android and iOS EAS build/submit profiles exist.
- Confirmed screenshot proof boards are self-contained SVGs and all individual screenshot proof files parse as XML.
- Confirmed mobile TypeScript currently passes.
- Confirmed the admin production build completes; it still reports the existing Next.js warning about one `<img>` in `MediaUrlInput.tsx`.

## Current launch blockers before real users

1. **Weekly emails are not automatic yet**
   - The app has weekly email preference/unsubscribe data.
   - You still need a scheduled worker/cron job to send weekly emails through SMTP, Resend, SendGrid, Postmark, or another provider.

2. **Push notifications require real Expo credentials**
   - The mobile app uses Expo Notifications.
   - Android push delivery needs Firebase/FCM configured through Expo/EAS credentials.
   - iOS push delivery needs Apple push credentials configured through Expo/EAS.
   - `EXPO_ACCESS_TOKEN` should be set on Railway if using Expo push API with authenticated requests.

3. **Mobile store release requires real store accounts**
   - Google Play Developer account is required for Android release.
   - Apple Developer Program account is required for iOS release.
   - Store screenshots, privacy policy, support URL, data-safety forms, and age/content ratings must be completed.

4. **Uploads require Cloudflare R2 production configuration**
   - The backend returns short-lived presigned R2 PUT URLs; large bytes never pass through Railway.
   - Configure a bucket-limited R2 API token, public/custom media domain, and browser CORS.

5. **Production database must be migrated**
   - Railway PostgreSQL must be attached to the backend service.
   - Run `alembic upgrade head` after the first deploy and after future migrations.

## Deploy backend on Railway

1. Create a Railway project.
2. Add a PostgreSQL database service.
3. Add the backend service from this repository.
4. Use the root repository with `railway.json`, or set the backend Dockerfile path to `backend/Dockerfile`.
5. Set these Railway variables on the backend service:

```env
APP_ENV=production
API_V1_PREFIX=/api/v1
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate-a-random-32-plus-character-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=https://<your-vercel-admin-domain>
SQL_ECHO=false
OPENAI_API_KEY=<optional-for-ai-assistant>
OPENAI_MODEL=gpt-4o-mini
EXPO_ACCESS_TOKEN=<expo-access-token-for-push>
WEEKLY_EMAILS_ENABLED=false
EMAIL_PROVIDER=smtp
SMTP_HOST=<smtp-host-if-weekly-emails-enabled>
SMTP_PORT=587
SMTP_USER=<smtp-user-if-weekly-emails-enabled>
SMTP_PASSWORD=<smtp-password-if-weekly-emails-enabled>
EMAIL_FROM=Family Pledge <no-reply@your-domain.org>
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<bucket-limited-access-key>
R2_SECRET_ACCESS_KEY=<bucket-limited-secret>
R2_BUCKET_NAME=<production-bucket>
R2_PUBLIC_BASE_URL=https://media.familypledge.org
R2_MAX_UPLOAD_MB=500
R2_ALLOWED_UPLOADS_MODE=broad
```

6. Deploy the backend.
7. Run migrations in the Railway shell:

```bash
cd /app
alembic upgrade head
```

8. Check health:

```bash
curl https://<railway-backend-domain>/health
```

## Deploy admin frontend on Vercel

1. Import the same GitHub repository in Vercel.
2. Set the Vercel project Root Directory to `frontend/admin`; the admin-scoped `frontend/admin/vercel.json` then uses:
   - Framework: Next.js
   - Root Directory: `frontend/admin`
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: `.next`
3. Set this Vercel variable:

```env
NEXT_PUBLIC_API_URL=https://<railway-backend-domain>/api/v1
```

4. Deploy.
5. Add the Vercel domain to Railway `CORS_ORIGINS`.
6. Re-deploy/restart backend after CORS changes.

### If Vercel still runs `cd frontend/admin && npm install`

That command is only valid when the Vercel project root is the repository root. When the Vercel Root Directory is already `frontend/admin`, the install command must be `npm install` only. Remove the old override in Vercel Project Settings, then redeploy the failed preview/build. See `docs/VERCEL_ADMIN_DEPLOY_FIX.md`.

## Railway PostgreSQL

1. Add Railway PostgreSQL to the Railway project.
2. Reference its `DATABASE_URL` from the backend service.
3. Keep backups enabled if your Railway plan supports it.
4. Run Alembic migrations after deploy.
5. Create the first super admin using `backend/scripts/seed_super_admin.py` or a Railway shell command.

## Emails

### Transactional/provider setup

Use one of these:

- SMTP provider from your hosting/email company.
- Resend, SendGrid, Postmark, Mailgun, or Amazon SES.

Set the SMTP variables in Railway and turn on:

```env
WEEKLY_EMAILS_ENABLED=true
```

### Missing production piece

A scheduler still needs to be added for weekly emails. Options:

- Railway cron service that calls a backend management command.
- GitHub Actions cron that calls a protected backend endpoint.
- External cron such as cron-job.org calling a protected endpoint.

Do not turn weekly emails on for real users until the scheduler is implemented and tested.

## Firebase / push notifications

This app currently uses Expo Notifications, not a direct Firebase SDK integration.

1. Create or open a Firebase project for Android.
2. Add Android app package: `org.namlef.familypledge`.
3. Download/use Firebase service credentials in Expo/EAS credentials setup.
4. In Expo/EAS, configure Android FCM credentials.
5. For iOS, configure Apple push notification credentials through EAS.
6. Set `EXPO_ACCESS_TOKEN` on Railway.
7. Build a real device app; push notifications cannot be fully validated only in a simulator.
8. Test admin one-click notification sending against a real installed app with granted notification permission.

## Uploads / Cloudflare R2

1. Create a Cloudflare R2 bucket and a token limited to that bucket.
2. Attach the custom public media domain and set `R2_PUBLIC_BASE_URL` to its HTTPS origin.
3. Configure R2 CORS for the deployed admin origins and the `PUT` method/`Content-Type` header.
4. Store all R2 credentials only on the backend; never use a `NEXT_PUBLIC_` prefix for secrets.
5. The admin requests `/admin/storage/r2-presigned-upload`, uploads directly to R2, then calls `/admin/storage/r2-confirm-upload` to save metadata.
6. Check `/admin/storage/usage` for application totals and the Cloudflare dashboard for billing truth.

## Build Android and iOS apps

From `frontend/mobile`:

```bash
npm install
npm install -g eas-cli
eas login
eas init
```

Make sure the EAS project ID is real. The placeholder/fallback must be replaced with the actual EAS project ID from Expo.

### Android production build

```bash
eas build --platform android --profile production
```

### iOS production build

```bash
eas build --platform ios --profile production
```

## Submit to Google Play Store

1. Create a Google Play Developer account.
2. Create the Family Pledge app in Play Console.
3. Complete app content, privacy policy, data safety, and store listing.
4. Configure a Google service account for EAS Submit.
5. Build Android with EAS.
6. Submit:

```bash
eas submit --platform android --profile production
```

## Submit to Apple App Store

1. Join the Apple Developer Program.
2. Create the app record in App Store Connect using bundle ID `org.namlef.familypledge`.
3. Complete privacy nutrition labels, support URL, screenshots, category, age rating, and review notes.
4. Build iOS with EAS.
5. Submit:

```bash
eas submit --platform ios --profile production
```

## Final go/no-go answer

- **Backend**: deployable after Railway variables and migrations are configured.
- **Admin**: deployable on Vercel after `NEXT_PUBLIC_API_URL` points to Railway.
- **Mobile Android/iOS**: build-ready after real EAS project/credentials are configured, but not store-ready until Play/App Store metadata, privacy forms, screenshots, and push credentials are completed.
- **Emails**: not launch-ready for weekly automated emails until a scheduler is implemented.
- **Uploads**: ready after R2 variables, custom domain, and CORS are configured and tested.
