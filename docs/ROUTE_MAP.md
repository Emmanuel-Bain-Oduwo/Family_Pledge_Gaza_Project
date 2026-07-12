# Route Map

## Backend API routes
- Auth: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/save-push-token`
- Dashboard: `/api/v1/dashboard`
- Pledges: `/api/v1/pledges/status`
- Contributions: `/api/v1/contributions`
- Campaigns: `/api/v1/campaigns`, `/api/v1/campaigns/:id`
- Impact: `/api/v1/impact`
- Reminders: `/api/v1/reminders/today`
- NAMLEF: `/api/v1/namlef/content`
- Collector: `/api/v1/collector/dashboard`

## Admin pages
- Dashboard, donors, contributions review, settings/payment details: confirm exact routes in `frontend/admin` before deployment.

## Mobile app routes
- `/`, `/auth/login`, `/auth/register`, `/tabs/home`, `/tabs/pledge`, `/tabs/campaigns`, `/tabs/reminders`, `/tabs/profile`
- `/screens/contribute`, `/screens/updates`, `/screens/namlef`, `/screens/collector-dashboard`, `/screens/notifications`

## Mobile web preview owner-demo aliases
- [x] `/onboarding/welcome` → `/`
- [x] `/login` → `/auth/login`
- [x] `/register` → `/auth/register`
- [x] `/home/dashboard` → `/tabs/home`
- [x] `/pledge` → `/tabs/pledge`
- [x] `/contribution/payment` → `/screens/contribute`
- [x] `/reminders` → `/tabs/reminders`
- [x] `/campaigns` → `/tabs/campaigns`
- [x] `/updates/impact` → `/screens/updates`
- [x] `/NAMLEF/about` → `/screens/namlef`
- [x] `/collector/referral/my-circle` → `/screens/collector-dashboard`
- [x] `/profile` → `/tabs/profile`
