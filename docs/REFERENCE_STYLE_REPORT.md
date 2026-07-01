# Family Pledge Reference-Style Implementation Report

## Status

The app has been moved closer to the supplied Family Pledge/NAMLEF reference board. The mobile welcome screen now follows the reference composition: trust badges, logo lockup, NAMLEF label, “Small Pledge, Big Impact” hero copy, primary/secondary pledge actions, and a Gaza/Jerusalem-inspired skyline card.

## What changed now

- Reworked the Expo mobile welcome screen to match the reference landing panel more closely.
- Applied reference-style card shadows, rounded cards, tab navigation styling, and pledge-status card treatment across shared mobile components so more features inherit the same user-friendly look.
- Applied the same clean white-card, dark-sidebar, rounded-control direction to the admin dashboard shell and KPI cards.
- Added the same high-level promise badges used in the mockup: free-to-join, impact, secure/private, and global/community messaging.
- Changed the welcome screen from a generic green hero to a white/soft-green editorial landing page with stronger green typography and pledge-focused actions.
- Updated the mobile welcome SVG screenshot proof so the documentation preview reflects the new visual direction.

## What already exists across the app

### Mobile donor app

- Welcome / pledge sign-up entry
- Login and registration
- Home dashboard with pledge status
- Campaigns and campaign details
- Pledge history
- Contribution instructions and proof submission
- Updates and impact-style content
- Daily reminder screen with Islamic reminder content
- NAMLEF/messages screen
- Collector dashboard
- Notifications and profile

### Admin dashboard

- Dashboard KPI cards
- Donor management
- Contribution review
- Campaign management
- Project/update management
- Reminder management
- Collector management
- Notification sending
- AI assistant draft generation
- NAMLEF content management
- Impact content management
- Settings

### Backend

- FastAPI API routes for mobile and admin flows
- PostgreSQL models and Alembic migrations
- JWT auth and role checks
- Contribution, pledge, campaign, project, reminder, notification, collector, NAMLEF, impact, and AI draft data models
- Expo push-token storage and admin push notification sending
- Weekly email preference/unsubscribe data model

## Important truth

The mobile welcome screen and shared UI system are now much closer to the reference image. The entire application is still not guaranteed to be pixel-perfect across every screen because exact parity requires approved logo files, exact photography, exact fonts, and a screen-by-screen visual pass for every mobile and admin route.

## Next exact-match checklist

1. Add final logo assets and approved campaign/update photos.
2. Apply the same spacing, card radius, shadows, tab bar, and typography to every mobile screen.
3. Apply the same admin dashboard layout to dashboard, AI assistant, and contributions.
4. Run the app locally and regenerate screenshots for every route.
5. Compare each screenshot against the supplied reference board before deployment.
