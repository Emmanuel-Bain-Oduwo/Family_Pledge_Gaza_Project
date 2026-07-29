# Scalability and release readiness

The application uses bounded configurable database pools, paginated public/admin lists,
batched donor queries, and direct-to-R2 uploads. This supports a 10,000 registered-user
target without creating one connection per user.

No code review can guarantee 10,000 simultaneous requests. Run representative staging
load tests for login, feeds, campaigns, reminders, and contributions on the actual
production database and hosting tier. Measure p95 latency, errors, CPU, memory, database
locks, and connection usage. Keep API worker count multiplied by `DB_POOL_SIZE` plus
`DB_MAX_OVERFLOW` below the database provider connection cap.

Before store release, use a unique 32+ character JWT secret, explicit CORS origins, TLS,
Sentry alerts, tested backups, physical Android/iOS notification testing, privacy and
account-deletion checks, and apply Alembic through revision `0011`. Verify payment details
with the account owner before accepting contributions.
