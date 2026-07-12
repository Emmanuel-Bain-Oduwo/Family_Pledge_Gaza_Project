# Environment Matrix

| Area | Env var | Local example | Production placeholder | Required | Where to set |
|---|---|---|---|---|---|
| Backend | `DATABASE_URL` | `postgresql://localhost/family_pledge` | provider database URL | Required | Backend host |
| Backend | `SECRET_KEY` | local generated secret | production secret | Required | Backend host |
| Backend | `CLOUDINARY_URL` | optional local value | Cloudinary URL | Optional until uploads | Backend host |
| Admin | `NEXT_PUBLIC_API_URL` / app API URL | `http://localhost:8000/api/v1` | `https://YOUR_DEPLOYED_BACKEND_DOMAIN/api/v1` | Required | Admin Vercel |
| Mobile | `EXPO_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | `https://YOUR_DEPLOYED_BACKEND_DOMAIN/api/v1` | Required | `frontend/mobile/.env`, Mobile Vercel, EAS env |
| Mobile | `EXPO_PUBLIC_EAS_PROJECT_ID` | `family-pledge-namlef` | real Expo project ID | Optional | EAS/Vercel if needed |
