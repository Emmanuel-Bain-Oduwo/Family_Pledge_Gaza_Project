# Family Pledge Store Release Runbook

This runbook covers the technical gates between the store-readiness PR stack and Google Play / Apple TestFlight. Store listing copy, screenshots, declarations and final review strategy are intentionally handled separately in PR F.

## 1. Release architecture

The same Expo donor codebase in `frontend/mobile` produces:

- Android (`org.namlef.familypledge`)
- iOS (`org.namlef.familypledge`)
- Expo Web

The Next.js admin dashboard is a separate web application in `frontend/admin`.

Production API:

```text
https://api.familypledgekenya.org/api/v1
```

Public application media:

```text
https://media.familypledgekenya.org
```

Private contribution proofs use a separate R2 bucket with no public hostname.

## 2. Workstation prerequisites

Use Node 20.19.x or newer within the Node 20 line for this release. The repository includes `frontend/mobile/.nvmrc` with 20.19.4.

Install or update EAS CLI without committing credentials:

```bash
npm install --global eas-cli
```

Authentication remains local to the operator's machine:

```bash
eas login
eas whoami
```

Never commit Expo access tokens, Apple credentials, Google service-account JSON, keystore passwords, APNs keys, or R2 secrets.

## 3. Final SDK 55 dependency lock

PR C deliberately removes the stale SDK 51 lockfile. Before a signed build, regenerate and commit an SDK 55 lockfile:

```bash
cd frontend/mobile
npm install
npx expo install --fix
npx expo-doctor@latest
npm run typecheck
npm run build:web
```

Then review `package.json` / `package-lock.json` and commit the regenerated `package-lock.json`.

Do not use the old SDK 51 lockfile for EAS Build.

## 4. Confirm or link the EAS project

From `frontend/mobile`:

```bash
eas project:info
```

If this reports that the project is not configured, use the interactive project-link flow:

```bash
eas init
```

Do not invent or manually guess an EAS project ID. After linking, Expo writes the real project ID into app configuration. Review that diff and commit only the non-secret project identifier/configuration.

Verify again:

```bash
eas project:info
```

## 5. Private contribution-proof storage before backend deployment

Create a dedicated Cloudflare R2 bucket, recommended name:

```text
family-pledge-private-proofs
```

Requirements:

- no public custom domain;
- no public r2.dev URL;
- credentials scoped as narrowly as practical;
- keep public media and database backups in their existing separate buckets.

On the OVH server, place the values in `deploy/ovh/.env` yourself:

```env
PROOF_R2_ACCOUNT_ID=
PROOF_R2_ACCESS_KEY_ID=
PROOF_R2_SECRET_ACCESS_KEY=
PROOF_R2_BUCKET_NAME=family-pledge-private-proofs
PROOF_RETENTION_DAYS=30
PROOF_SIGNED_GET_TTL_SECONDS=600
```

Do not paste those secrets into tickets, GitHub, documentation or chat.

## 6. Deploy backend migrations after PR A-D are merged

On OVH:

```bash
cd ~/Family_Pledge_Gaza_Project
git pull --ff-only
cd deploy/ovh

docker compose build backend
docker compose run --rm backend alembic upgrade head
docker compose up -d backend
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Verify:

```bash
curl -fsS https://api.familypledgekenya.org/health
curl -fsS https://api.familypledgekenya.org/ready
```

The new migrations include private-proof retention fields and opt-in notification preference fields.

## 7. Schedule the 30-day proof purge

Sensitive payment screenshots and raw transaction message/reference values expire after 30 days. The purge script preserves the contribution accounting row.

Test manually first:

```bash
cd ~/Family_Pledge_Gaza_Project/deploy/ovh
bash scripts/purge_expired_proofs.sh
```

After a successful manual run, schedule it daily using the server's normal scheduler (cron or systemd timer). The scheduled command should invoke the same script from the deployment directory and log failures for operator review.

Do not consider PR A fully deployed until the automatic purge is scheduled and a test run succeeds.

## 8. Android push credentials (FCM V1)

Family Pledge uses Expo Push Service in the backend. Expo forwards Android pushes through Firebase Cloud Messaging (FCM), so Android remote notifications still require valid FCM credentials.

Use or create a Firebase project for `org.namlef.familypledge`, then configure FCM V1 credentials through the EAS credential flow. Keep the Google service-account JSON private.

From `frontend/mobile`:

```bash
eas credentials --platform android
```

Follow Expo's FCM V1 credential prompts. Do not commit the service-account private key.

The app's Daily and Friday reminders are local device schedules. Campaign and Emergency pushes are remote and therefore require working FCM/APNs delivery.

## 9. iOS push credentials (APNs)

A paid Apple Developer Program membership is required for the iOS signing and push-credential flow.

From `frontend/mobile`:

```bash
eas credentials --platform ios
```

Allow EAS to configure or select the correct Apple Push Notification service key, distribution certificate and provisioning profile for `org.namlef.familypledge`.

Keep Apple credentials and private keys out of the repository.

## 10. Android preview build

The `preview` EAS profile produces an installable APK for physical-device testing:

```bash
cd frontend/mobile
eas build --platform android --profile preview
```

Install the resulting build on a real Android device and test:

- launch / cold start;
- registration and login;
- session persistence;
- Home data and retry state;
- campaigns and impact media;
- Cloudflare Stream playback;
- free pledge;
- paid contribution;
- native screenshot picker;
- private proof upload;
- contribution submission;
- notification consent;
- Daily/Friday local reminders;
- Campaign/Emergency remote push;
- notification preferences;
- Profile/offline cached real profile;
- account deletion;
- logout and relaunch.

Expo Go is not the release acceptance environment for native features.

## 11. Android production build

After preview testing passes:

```bash
cd frontend/mobile
eas build --platform android --profile production
```

The production profile explicitly builds an Android App Bundle (`.aab`) and uses EAS remote versioning with automatic `versionCode` increments.

The `.aab` is the artifact used for Google Play. Do not try to install the `.aab` directly as the preview test app.

## 12. Google Play internal testing gate

Upload the production AAB to Google Play Internal Testing before any production rollout. Install the Play-delivered build on a physical Android device and repeat all critical flows against the production API.

PR F will handle the store listing, Data Safety, Financial Features declaration, content rating, screenshots, account-deletion URL, app-access instructions, countries/regions and release notes.

## 13. iOS production build and TestFlight

After Android native flows are stable:

```bash
cd frontend/mobile
eas build --platform ios --profile production
```

Upload/submit the resulting iOS build to App Store Connect using the authenticated EAS/Apple flow. Test through TestFlight on at least one real iPhone before App Store review.

Critical TestFlight checks:

- registration/login;
- SecureStore session persistence;
- private proof photo selection/upload;
- APNs remote notifications;
- local Daily/Friday reminders;
- media/video;
- account deletion;
- offline/API error behavior;
- cold-start notification routing.

## 14. CI versus signed native builds

GitHub CI validates source-level release health:

- backend compile;
- Alembic upgrade;
- pytest;
- admin TypeScript/build;
- Expo dependency alignment;
- Expo Doctor;
- donor TypeScript;
- public Expo config;
- donor Web export.

CI success does **not** prove that Apple/Google signing credentials, FCM/APNs, or a store-delivered build work. Those gates require EAS/account credentials and physical-device testing.

## 15. Release stop conditions

Do not submit to stores if any of these remain unresolved:

- private proof bucket not configured;
- 30-day purge not scheduled/tested;
- account deletion not tested end-to-end;
- Expo Doctor dependency errors;
- no regenerated SDK 55 lockfile;
- EAS project not linked;
- Android FCM remote push not proven;
- iOS APNs remote push not proven;
- Android preview/device test failures;
- Google Play internal-test failures;
- TestFlight failures;
- production API `/ready` unhealthy.

## 16. Useful commands

```bash
# EAS identity/project
eas whoami
eas project:info

# Expo health
npx expo install --check
npx expo-doctor@latest
npm run typecheck
npm run build:web

# Android test build
eas build --platform android --profile preview

# Android Play build
eas build --platform android --profile production

# iOS TestFlight/App Store build
eas build --platform ios --profile production

# Credential management
eas credentials --platform android
eas credentials --platform ios
```
