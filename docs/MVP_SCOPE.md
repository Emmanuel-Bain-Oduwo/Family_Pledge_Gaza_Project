# Family Pledge for Gaza — MVP Scope

## Purpose

Family Pledge is a NAMLEF-linked humanitarian pledge app that enables Muslim families across Eastern Africa (and globally) to commit USD 10 per month in solidarity with Gaza. The backend tracks pledges, verifies contributions, and provides transparent impact reporting.

---

## MVP Features

### Mobile App (React Native / Expo)

| Feature | Description |
|---------|-------------|
| Registration & Login | Phone or email + password; JWT session |
| Home Dashboard | Greeting, pledge status card, active campaign, monthly progress, latest reminder, latest impact |
| Pledge Tab | View active pledge, status (paid/pending/none), contribution history, anonymous toggle |
| Contribute Screen | Submit contribution with amount, reference number, payment method, optional proof image |
| Campaigns Tab | Browse active campaigns; Friday Challenge, emergency, monthly, general |
| Reminders Tab | Daily Islamic reminders: Quran, Hadith, Du'a, Motivation, Friday |
| NAMLEF Screen | About NAMLEF, Sheikh messages, voices of support |
| Updates Screen | Impact cards: food, medical, shelter, water delivered on the ground |
| Profile Screen | View profile, badges, sign out |
| Notifications | Expo Push Notifications for campaign alerts and reminders |

### Admin Dashboard (Next.js)

| Feature | Description |
|---------|-------------|
| Login | Email + password; admin-only access |
| Dashboard Stats | Total donors, active pledges, contributions this month, pending review count |
| Contribution Review | Confirm or reject submitted contributions with admin notes |
| Campaign Management | Create, edit, archive campaigns |
| Project Management | Create and manage relief projects |
| Impact Cards | Create impact stories with images/videos |
| Reminders | Draft, approve, and publish daily Islamic reminders |
| NAMLEF Content | Manage about, sheikh messages, voices of support |
| Collectors | Register collectors, view their circles |
| Notifications | Send push notifications to all users or filtered audiences |
| AI Assistant | Generate reminder drafts, impact updates, weekly summaries, collector messages |
| Media Upload | Direct Cloudinary upload for images; YouTube URL support for long videos |

### Backend (FastAPI)

| Endpoint Group | Routes |
|----------------|--------|
| Auth | /auth/register, /auth/login, /users/me, /users/me/anonymous |
| Dashboard | GET /dashboard (mobile aggregated) |
| Pledges | POST /pledges, GET /pledges/me, GET /pledges/me/status |
| Contributions | POST /contributions/submit, GET /contributions/me |
| Campaigns | GET /campaigns, GET /campaigns/active, GET /campaigns/:id |
| Projects | GET /projects, GET /projects/:id |
| Impact Cards | GET /impact-cards, GET /impact-cards/:id |
| Daily Reminders | GET /daily-reminders, GET /daily-reminders/today |
| NAMLEF Content | GET /namlef-content, GET /namlef-content/featured |
| Collectors | GET /collectors/me/dashboard, GET /collectors/me/members |
| Admin | All /admin/* routes (protected) |
| AI Assistant | POST /admin/ai/* |
| Storage | POST /admin/storage/cloudinary-signature |
| Notifications | GET/POST /admin/notifications/* |

---

## Data Model Summary

- **User**: donor / collector / admin / super_admin roles
- **Pledge**: monthly commitment (default $10 USD)
- **Contribution**: monthly payment submission with proof; admin-reviewed
- **Campaign**: friday_challenge / emergency / monthly / general
- **Project**: relief project with category, target, and progress
- **ImpactCard**: story of delivered aid linked to projects
- **DailyReminder**: Islamic content (Quran, Hadith, Du'a, etc.)
- **NamlefContent**: NAMLEF institutional content (video, audio, text, link)
- **Collector**: a collector manages a group of donors
- **Notification**: push notification with audience targeting

---

## Out of Scope (Phase 1)

- Online payment processing (contributions are manual bank transfers)
- Public leaderboard
- Multi-currency pledge amounts
- iOS/Android app store deployment (EAS Build required)
- Video hosting (long videos use YouTube unlisted links)
