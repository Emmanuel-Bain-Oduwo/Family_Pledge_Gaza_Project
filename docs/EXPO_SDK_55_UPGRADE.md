# Expo SDK 55 upgrade

The Family Pledge donor application targets Expo SDK 55 for the first store release.

## Why SDK 55

SDK 55 uses React Native 0.83 and React 19.2, targets Android API 36, requires the modern New Architecture, and supports the Xcode 26-era iOS toolchain while retaining iOS 15.1+ compatibility.

## Repository changes

`frontend/mobile/package.json` is aligned to the SDK 55 package family and Node 20.19+.

The legacy root `splash` configuration was moved to the `expo-splash-screen` config plugin. `expo-secure-store` remains configured and iOS export-compliance metadata is set through `ios.config.usesNonExemptEncryption=false`.

`expo-notifications` is configured through its config plugin, including the background remote-notification mode used by the notification implementation.

SDK 55 runs entirely on React Native's New Architecture. There is no `newArchEnabled=false` fallback in this release.

## Required dependency refresh

The old SDK 51 lockfile was intentionally removed because it must not be used for an SDK 55 EAS build. On a Node 20.19+ workstation, run:

```bash
cd frontend/mobile
npm install
npx expo install --fix
npx expo-doctor@latest
npm run typecheck
npm run build:web
```

Commit the regenerated `package-lock.json` before the final signed store build.

Do not use `npm ci` until the SDK 55 lockfile has been regenerated and committed.

## Native validation

Expo Go is not the release validation environment for this app. Use an EAS development/preview build for native testing, especially for push notifications.

Before a release build:

```bash
npx expo-doctor@latest
npx expo config --type public
```

Then follow `docs/STORE_RELEASE_RUNBOOK.md` once PR E is merged.
