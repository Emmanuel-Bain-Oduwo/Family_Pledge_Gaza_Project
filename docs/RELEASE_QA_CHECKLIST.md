# Production Release QA Checklist

**Normal User:**
- [ ] Mobile web app loads
- [ ] New user registration
- [ ] Login
- [ ] View Dashboard
- [ ] Create Pledge
- [ ] Submit Contribution Proof
- [ ] View History

**Admin User:**
- [ ] Admin dashboard loads
- [ ] Login
- [ ] View Stats
- [ ] View Donors
- [ ] Review Contributions (Confirm/Reject/Follow-up)
- [ ] Send Notifications

**Operational:**
- [ ] DB Backup verified
- [ ] Sentry active
- [ ] Smoke test (`scripts/smoke_test_production.py`) passes
- [ ] Secrets rotated
- [ ] `DEMO_SEED_ON_STARTUP=false`
- [ ] `RUN_MIGRATIONS_ON_STARTUP=false` (after initial deploy)
