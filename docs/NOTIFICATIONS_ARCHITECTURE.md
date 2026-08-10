# Family Pledge cross-platform notifications

## Boundary

Firebase is used **only for notification transport**. Family Pledge does not use Firebase Authentication, Firestore, Realtime Database, or Firebase Storage. User accounts, pledges, contributions, media metadata, admin data, and AI data stay in the existing FastAPI/PostgreSQL architecture.

## Delivery paths

```text
Admin sends one Family Pledge notification
                |
                +--> Android/iOS endpoint (ExpoPushToken)
                |        |
                |        +--> Expo Push Service
                |              +--> Android: Firebase Cloud Messaging (FCM)
                |              +--> iOS: Apple Push Notification service (APNs)
                |
                +--> Web endpoint (FCM Web registration token)
                         |
                         +--> Firebase Cloud Messaging
                                  |
                                  +--> browser Push API/service worker
```

The backend stores more than one notification endpoint per account so the same donor can use a browser and a phone without one token replacing another.

## Consent

Notification categories remain opt-in:

- Daily pledge reminder
- Friday/Jumu'ah reminder
- Campaign/impact updates
- Emergency appeals

Native Daily and Friday reminders are scheduled locally by `expo-notifications`. Campaign, impact, emergency, reminder/pledge remote messages and system notifications are delivered by the backend according to account preferences. Web receives remote notifications through FCM Web; it does not use `expo-notifications` for browser push.

## Android

1. Use the existing Firebase project or create the Android app entry for package `org.namlef.familypledge`.
2. Download `google-services.json` from Firebase Console.
3. Configure Android FCM V1 credentials through EAS credentials.
4. Keep the app obtaining an Expo Push Token. The backend sends the native message to Expo Push Service; Expo hands Android delivery to FCM.

Do not paste service-account private keys into chat or commit them to Git.

## iOS

The iOS bundle identifier remains `org.namlef.familypledge`.

1. EAS/Apple credentials configure APNs for the app.
2. The app obtains an Expo Push Token.
3. The backend sends to Expo Push Service, which delivers to APNs.

Firebase is not used as the iOS application backend.

## Web

The donor Web build needs these public Vercel environment variables:

```text
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_FIREBASE_VAPID_KEY
```

These are Firebase Web client identifiers/public configuration, not the backend service-account private key.

`npm run build:web` generates `/firebase-messaging-sw.js` at build time. The browser asks for notification permission only after the user explicitly enables notification preferences. Once allowed, the client obtains an FCM Web registration token and sends that token to the authenticated Family Pledge backend.

The backend uses:

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON_B64
WEB_APP_BASE_URL
```

`FIREBASE_SERVICE_ACCOUNT_JSON_B64` is the base64-encoded service-account JSON. It belongs only in the OVH backend environment and must never be exposed as `EXPO_PUBLIC_*`.

## Database

Migration `0015_notification_endpoints.py` creates `notification_endpoints` with:

- `user_id`
- `provider`: `expo` or `fcm_web`
- `platform`: Android, iOS, Web, or legacy native
- token
- optional device ID
- active state and last-seen time

The old `users.push_token` is temporarily retained for backward compatibility with already-installed builds.

## Test matrix before release

### Android physical device
- Opt in to Campaign Updates.
- Verify Expo token registration.
- Send admin campaign notification while app foregrounded, backgrounded, and closed/locked.
- Disable Campaign Updates and verify campaign pushes stop.
- Repeat Emergency opt-in/out.

### iPhone physical device
- Repeat the same tests through APNs.
- Verify notification tap opens the in-app notification feed.

### Web browser
- Deploy over HTTPS.
- Enable Campaign Updates and grant browser permission.
- Verify the service worker is registered and an FCM Web token is stored.
- Test foreground and background/tab-closed notification delivery supported by the browser.
- Disable the category and verify backend preference filtering stops that category.

## Account deletion

Account deletion removes notification endpoint tokens together with other app-only account data. Retained anonymized pledge/contribution accounting records do not retain browser or device notification tokens.
