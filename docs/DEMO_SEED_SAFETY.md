# Production Demo Seed Safety

**CRITICAL RULE:** The variable `DEMO_SEED_ON_STARTUP` must ALWAYS be `false` in production.

If you ever need to seed the production database deliberately, you must pass BOTH:
- `APP_ENV=production`
- `ALLOW_DEMO_SEED_IN_PRODUCTION=true`

Failing to do so will cause the backend to reject the seed request to prevent accidental data corruption.
