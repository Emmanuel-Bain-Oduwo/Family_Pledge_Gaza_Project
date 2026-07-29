# Environment Variable Matrix

| Service | Variable | Required | Purpose / placement |
|---|---|---:|---|
| Backend | `DATABASE_URL` | Yes | PostgreSQL connection string |
| Backend | `JWT_SECRET` | Yes | Production authentication secret (32+ characters) |
| Backend | `CORS_ORIGINS` | Yes | Comma-separated admin/mobile web origins |
| Backend | `R2_ACCOUNT_ID` | For uploads | Cloudflare account identifier |
| Backend | `R2_ACCESS_KEY_ID` | For uploads | Bucket-limited R2 API access key |
| Backend | `R2_SECRET_ACCESS_KEY` | For uploads | Bucket-limited R2 secret key |
| Backend | `R2_BUCKET_NAME` | For uploads | Production R2 bucket |
| Backend | `R2_PUBLIC_BASE_URL` | For uploads | Absolute public/custom media origin, e.g. `https://media.familypledge.org` |
| Backend | `R2_MAX_UPLOAD_MB` | No | Configurable safety ceiling; defaults to `500` |
| Backend | `R2_ALLOWED_UPLOADS_MODE` | No | Upload policy selection; defaults to `broad` |
| Admin | `NEXT_PUBLIC_API_URL` | Yes | Public backend API base URL; never place R2 credentials here |
| Admin | `NEXT_IMAGE_REMOTE_HOSTNAMES` | If using Next Image | Include the R2 custom media hostname |
| Mobile/EAS | `EXPO_PUBLIC_EAS_PROJECT_ID` | For native push | EAS project UUID used to obtain Expo push tokens |
| Backend | `EXPO_ACCESS_TOKEN` | Recommended for push | Expo access token when enhanced push security is enabled |

Cloudinary variables are not production storage requirements. R2 credentials must never use the `NEXT_PUBLIC_` prefix and must never be shipped to browsers or mobile builds.
