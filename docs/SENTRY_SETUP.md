# Sentry Configuration Guide

To enable error monitoring safely:
1. Obtain the `SENTRY_DSN` from your Sentry dashboard.
2. Add it to your Railway production variables for the backend.
3. Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel for the admin dashboard.
4. Add `EXPO_PUBLIC_SENTRY_DSN` to Vercel for the mobile web preview.

The application is configured to initialize Sentry ONLY if these environment variables are present. If absent, the app operates normally without crashing.
