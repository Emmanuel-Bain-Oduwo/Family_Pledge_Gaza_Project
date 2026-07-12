# Internal Changelog

## 2026-07-12
- Added Expo web static export support for `frontend/mobile`.
- Added Vercel config for the mobile preview project.
- Added web compatibility guards for auth storage, push notifications, clipboard, share, and external linking.
- Added owner-demo web route aliases for browser preview paths.
- Added mobile-width web container so desktop browsers preview the app at phone width.
- Added project tracking docs.
- Tests run: `npm install --prefix frontend/mobile`, `npm run build:web --prefix frontend/mobile`, admin build/lint, backend compileall.
- Remaining risks: production backend URL, deployed Vercel URLs, and end-to-end browser QA still need confirmation.
