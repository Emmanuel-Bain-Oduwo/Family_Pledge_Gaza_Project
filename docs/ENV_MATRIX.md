# Environment Variable Matrix

This matrix reflects the production target after the OVH/Cloudflare migration.

## Backend on OVH

| Service | Variable | Required | Purpose / placement |
|---|---|---:|---|
| OVH backend | `APP_ENV` | Yes | Set to `production` on OVH. |
| OVH backend | `API_V1_PREFIX` | Yes | API prefix, normally `/api/v1`. |
| OVH backend | `DATABASE_URL` | Yes | PostgreSQL connection string to the OVH PostgreSQL service/container. |
| OVH backend | `JWT_SECRET` | Yes | Production authentication secret, 32+ characters. |
| OVH backend | `JWT_ALGORITHM` | No | Defaults to `HS256`. |
| OVH backend | `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token lifetime. |
| OVH backend | `CORS_ORIGINS` | Yes | Exact comma-separated frontend origins, e.g. `https://admin.familypledge.org,https://app.familypledge.org`. |
| OVH backend | `SQL_ECHO` | No | Keep `false` in production. |
| OVH backend | `DB_POOL_SIZE` | Yes for b3-8 | Recommended `5` for the first b3-8 deployment. |
| OVH backend | `DB_MAX_OVERFLOW` | Yes for b3-8 | Recommended `10` for the first b3-8 deployment. |
| OVH backend | `DB_POOL_TIMEOUT_SECONDS` | No | Recommended `30`. |
| OVH backend | `RUN_MIGRATIONS_ON_STARTUP` | First deploy only | Use `true` only for the first OVH deploy or controlled migration deploy, then set `false`. |
| OVH backend | `DEMO_SEED_ON_STARTUP` | Yes | Keep `false` in production. |
| OVH backend | `SENTRY_DSN` | Recommended | Backend monitoring. Optional but recommended. |
| OVH backend | `SENTRY_TRACES_SAMPLE_RATE` | No | Defaults to low tracing rate. |

## AI provider

The AI assistant remains backend-controlled, admin-only, and draft/suggest-only. Do not give the AI model direct database credentials.

| Service | Variable | Required | Purpose / placement |
|---|---|---:|---|
| OVH backend | `OPENAI_API_KEY` | For AI | Backend-only API key for the OpenAI-compatible provider. |
| OVH backend | `OPENAI_BASE_URL` | For OVH GPT-OSS-120B | OVH GPT-OSS-120B OpenAI-compatible base URL. Backend only. |
| OVH backend | `OPENAI_MODEL` | For AI | Use `gpt-oss-120b` for the OVH endpoint. |

## Cloudflare media storage

| Service | Variable | Required | Purpose / placement |
|---|---|---:|---|
| OVH backend | `R2_ACCOUNT_ID` | For uploads | Cloudflare account identifier. |
| OVH backend | `R2_ACCESS_KEY_ID` | For uploads | Bucket-limited R2 API access key. Backend only. |
| OVH backend | `R2_SECRET_ACCESS_KEY` | For uploads | Bucket-limited R2 secret key. Backend only. |
| OVH backend | `R2_BUCKET_NAME` | For uploads | Production public media bucket, e.g. `familypledge-media`. |
| OVH backend | `R2_PUBLIC_BASE_URL` | For uploads | Public/custom media origin, e.g. `https://media.familypledge.org`. |
| OVH backend | `R2_MAX_UPLOAD_MB` | No | Configurable safety ceiling; defaults to `500`. |
| OVH backend | `R2_ALLOWED_UPLOADS_MODE` | No | Upload policy selection; defaults to `broad`. |
| OVH backend | `STREAM_API_TOKEN` | For videos | Cloudflare token with Stream write permission. Backend only. |
| OVH backend | `STREAM_CUSTOMER_CODE` | For videos | Customer subdomain code for Stream player and thumbnail URLs. |
| OVH backend | `STREAM_MAX_DURATION_SECONDS` | No | Maximum video duration; defaults to six hours. |

Cloudinary variables are not production storage requirements. R2 credentials must never use the `NEXT_PUBLIC_` prefix and must never be shipped to browsers or mobile builds.

## Private database backups to Cloudflare R2

Use a separate private bucket for database backups. Do not attach a public custom domain.

| Service | Variable | Required | Purpose / placement |
|---|---|---:|---|
| OVH backup script | `BACKUP_R2_ACCOUNT_ID` | Yes | Cloudflare account identifier for backup bucket. |
| OVH backup script | `BACKUP_R2_ACCESS_KEY_ID` | Yes | Backup-bucket-limited access key. |
| OVH backup script | `BACKUP_R2_SECRET_ACCESS_KEY` | Yes | Backup-bucket-limited secret key. |
| OVH backup script | `BACKUP_R2_BUCKET` | Yes | Private backup bucket, e.g. `familypledge-db-backups`. |
| OVH backup script | `BACKUP_R2_PREFIX` | No | Prefix for backup files, e.g. `db`. |
| OVH backup script | `BACKUP_KEEP_DAYS` | Policy note | Keep at least 7 daily backups; remote deletion should be handled carefully. |

## Frontends

| Service | Variable | Required | Purpose / placement |
|---|---|---:|---|
| Admin frontend | `NEXT_PUBLIC_API_URL` | Yes | Public backend API base URL: `https://api.familypledge.org/api/v1`. |
| Admin frontend | `NEXT_IMAGE_REMOTE_HOSTNAMES` | If using Next Image | Include the R2 custom media hostname. |
| Mobile/EAS | `EXPO_PUBLIC_API_URL` | Yes | Public backend API base URL: `https://api.familypledge.org/api/v1`. |
| Mobile/EAS | `EXPO_PUBLIC_EAS_PROJECT_ID` | For native push | EAS project UUID used to obtain Expo push tokens. |
| OVH backend | `EXPO_ACCESS_TOKEN` | Recommended for push | Expo access token when enhanced push security is enabled. |

## Email

| Service | Variable | Required | Purpose / placement |
|---|---|---:|---|
| OVH backend | `WEEKLY_EMAILS_ENABLED` | No | Keep `false` until a scheduler/provider is fully configured. |
| OVH backend | `EMAIL_PROVIDER` | No | Provider label, normally `smtp`. |
| OVH backend | `SMTP_HOST` | If weekly emails enabled | SMTP host. |
| OVH backend | `SMTP_PORT` | If weekly emails enabled | SMTP port, normally `587`. |
| OVH backend | `SMTP_USER` | If weekly emails enabled | SMTP username. |
| OVH backend | `SMTP_PASSWORD` | If weekly emails enabled | SMTP password. |
| OVH backend | `EMAIL_FROM` | If weekly emails enabled | Sender identity. |
