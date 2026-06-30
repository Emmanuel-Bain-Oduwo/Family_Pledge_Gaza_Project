# Family Pledge — Mobile App

A humanitarian mobile app for the Family Pledge initiative under NAMLEF, supporting Gaza relief. Donors pledge USD 10/month and use this app to track pledges, contribute, receive reminders, and see impact.

## Tech Stack

- **React Native** + **Expo** (~51)
- **Expo Router** (file-based routing)
- **TypeScript**
- **Axios** (API calls)
- **Expo SecureStore** (auth token storage)
- **Expo Notifications** (push notifications)
- **@expo/vector-icons** (Ionicons)

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx           # Root layout
│   ├── index.tsx             # Onboarding screen
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── tabs/
│   │   ├── _layout.tsx       # Bottom tabs
│   │   ├── home.tsx
│   │   ├── pledge.tsx
│   │   ├── campaigns.tsx
│   │   ├── reminders.tsx
│   │   └── profile.tsx
│   └── screens/
│       ├── contribute.tsx
│       ├── campaign-details.tsx
│       ├── project-details.tsx
│       ├── emergency-appeal.tsx
│       ├── friday-challenge.tsx
│       ├── updates.tsx
│       ├── namlef.tsx
│       ├── collector-dashboard.tsx
│       ├── badges.tsx
│       └── notifications.tsx
├── components/               # Reusable UI components
├── services/
│   ├── api.ts                # All API calls (Axios)
│   ├── auth.ts               # Token & user persistence
│   └── notifications.ts      # Push notification setup
├── constants/
│   ├── colors.ts             # Design system colours
│   ├── config.ts             # App config & API URL
│   └── mockData.ts           # Mock data fallback
└── types/
    └── index.ts              # TypeScript interfaces
```

## Quick Start

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Set up environment

Create a `.env` file in `mobile/`:

```env
EXPO_PUBLIC_API_URL=https://api.familypledge.org/api/v1
```

> Without this, the app falls back to mock data automatically.

### 3. Run the app

```bash
# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS (macOS only)
npx expo start --ios
```

### 4. Scan QR code

Use the **Expo Go** app (iOS/Android) to scan the QR code, or use an emulator.

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary Green | `#0B6B3A` | Buttons, headers, primary actions |
| Dark Green | `#064E2B` | Hero sections, profile header |
| Cream | `#F8F4E8` | App background |
| Gold | `#D6A437` | Accents, Friday challenge |
| Emergency Red | `#D94A38` | Emergency banners, alerts |

## Features

### Screens
- **Onboarding** — App intro, sign up / sign in / visitor mode
- **Register** — Full registration with anonymous toggle and collector code
- **Login** — Phone or email + password
- **Home** — Dashboard: greeting, pledge status, Friday challenge, emergency banner, impact, reminders
- **Pledge** — USD 10/month pledge, status, history, contribute, anonymous toggle
- **Campaigns** — Filter by type, progress bars, contribute buttons
- **Reminders** — Quran, Hadith, Du'a, motivation, Friday reminder with share
- **Profile** — Display name, pledge status, badges, anonymous toggle, logout
- **Contribute** — Payment methods, instructions, reference form submission
- **Friday Challenge** — 200-donor goal, live progress, share button
- **Emergency Appeal** — Urgent banner, progress, impact breakdown
- **Updates** — Impact cards, project reports, beneficiary counts
- **NAMLEF & Messages** — About, Sheikh message, voices of support
- **Collector Dashboard** — Circle stats, member list, invite code, reminder template
- **Badges** — All badges, earned vs locked, tiers
- **Notifications** — In-app notification list

### API Integration
All API calls are in `services/api.ts`. The app auto-falls back to `constants/mockData.ts` when the backend is unavailable, so the UI is always reviewable.

### Auth Flow
1. Token stored in `expo-secure-store`
2. On launch, app checks token — routes to Home if valid
3. Visitor mode skips auth entirely

### Push Notifications
- Requests permission on first home load
- Gets Expo push token and sends to `/auth/save-push-token`
- Schedules daily (8am) and Friday (9am) local reminders

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current user |
| POST | `/auth/save-push-token` | Save push token |
| GET | `/dashboard` | Home dashboard data |
| GET | `/pledges/status` | Pledge status + history |
| PATCH | `/auth/me` | Update anonymous preference |
| POST | `/contributions` | Submit contribution |
| GET | `/campaigns` | List campaigns |
| GET | `/campaigns/:id` | Campaign details |
| GET | `/impact` | Impact cards |
| GET | `/reminders/today` | Daily reminders |
| GET | `/namlef/content` | NAMLEF content |
| GET | `/collector/dashboard` | Collector stats |

## Contributing

This app is a NAMLEF initiative. All contributions must align with the project's humanitarian mission.
