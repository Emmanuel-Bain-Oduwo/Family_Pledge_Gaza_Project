# Family Pledge — Donor App

The donor app is built with Expo and React Native. The same `frontend/mobile` source tree produces two delivery targets:

- native Android/iOS builds through Expo EAS;
- a static Expo web export deployed separately on Vercel.

Both targets use the Family Pledge production API on OVH.

## Production API

```text
https://api.familypledgekenya.org/api/v1
```

The code reads:

```env
EXPO_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

`constants/config.ts` also contains the same production API as a fallback, and `eas.json` sets it for development, preview, and production EAS profiles.

## Tech stack

- React Native + Expo
- Expo Router
- TypeScript
- Axios
- Expo SecureStore
- Expo Notifications
- React Native Web

## Project structure

```text
frontend/mobile/
├── app/                    # Expo Router screens/routes
├── components/             # Reusable UI
├── services/
│   ├── api.ts              # Backend API client
│   ├── auth.ts             # Token persistence
│   └── notifications.ts    # Push setup
├── constants/
│   ├── config.ts           # API/public app configuration
│   └── payment.ts
├── types/
├── app.json                # Android/iOS application identifiers
├── eas.json                # Native EAS build profiles
├── vercel.json             # Expo web deployment config
└── .env.example
```

## Local development

```bash
cd frontend/mobile
npm install
cp .env.example .env
npx expo start
```

Run specific targets:

```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

## Authentication

The donor app uses the API auth routes under the configured base URL, including:

```text
POST /auth/register
POST /auth/login
GET  /users/me
POST /auth/save-push-token
```

Tokens are persisted through the app auth service and attached to authenticated API requests.

When debugging production registration/login, confirm the request reaches:

```text
https://api.familypledgekenya.org/api/v1/auth/register
https://api.familypledgekenya.org/api/v1/auth/login
```

## Main donor flows

- account registration and login;
- monthly pledge management;
- contribution submission and proof upload;
- campaigns and projects;
- impact updates;
- daily reminders;
- NAMLEF content;
- collector dashboard;
- notification feed;
- push-token registration in native builds.

## Native Android/iOS builds with EAS

Application identifiers:

```text
Android package: org.namlef.familypledge
iOS bundle identifier: org.namlef.familypledge
```

Install/login to EAS as needed:

```bash
npm install -g eas-cli
eas login
```

Production Android build:

```bash
cd frontend/mobile
eas build --platform android --profile production
```

Production iOS build:

```bash
cd frontend/mobile
eas build --platform ios --profile production
```

Do not submit a store build until registration, login, contribution flows, media/proof upload, and push-token registration have been tested against the OVH API.

## Donor web deployment on Vercel

The Vercel deployment is a browser build of the Expo app. It does not replace Android/iOS.

Vercel project settings:

```text
Root Directory: frontend/mobile
Build Command: npm run build:web
Output Directory: dist
Install Command: npm install
Framework Preset: Other / null
```

Required Vercel environment variable:

```env
EXPO_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

The backend `CORS_ORIGINS` must include the donor-web Vercel origin because the browser build is subject to CORS.

Build the web export locally:

```bash
npm run build:web
```

Preview it:

```bash
npm run preview:web
```

## Important difference: web vs native

Although web and native use the same source code:

- Vercel injects `EXPO_PUBLIC_API_URL` during the web build;
- EAS uses the profiles in `eas.json` for Android/iOS builds;
- browser requests require backend CORS approval;
- native Android/iOS networking does not use browser CORS in the same way;
- production push notifications require real EAS/FCM/APNs configuration and physical-device testing.

## Media and contribution proof uploads

The app requests upload information from the backend and then uploads to the configured storage service. Production public media is backed by Cloudflare R2; video delivery uses Cloudflare Stream where applicable.

Before store release, test the actual donor proof-upload flow against OVH and confirm the resulting object is accessible only as intended.

## Validation before release

At minimum test on a production/preview native build:

- registration;
- login/logout;
- token persistence;
- dashboard loading;
- campaigns/projects/impact/reminders;
- pledge creation/update;
- contribution submission;
- contribution proof upload;
- collector flows if enabled;
- push-token registration;
- notification handling;
- external links and sharing.

The Android Play Store and Apple App Store releases should use the same production API base unless a deliberate environment-specific backend is introduced later.
