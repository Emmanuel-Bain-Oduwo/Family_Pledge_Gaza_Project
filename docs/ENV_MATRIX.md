# Environment Variable Matrix

This matrix reflects the current production target after the OVH/Cloudflare migration.

## Backend on OVH

| Service | Variable | Required | Production value / purpose |
|---|---|---:|---|
| Caddy | `API_DOMAIN` | Yes | `api.familypledgekenya.org` |
| OVH backend | `APP_ENV` | Yes | `production` |
| OVH backend | `API_V1_PREFIX` | Yes | `/api/v1` |
| OVH backend | `DATABASE_URL` | Yes | PostgreSQL URL pointing to the Compose `postgres` service. |
| OVH backend | `JWT_SECRET` | Yes | Production authentication secret; never commit it. |
| OVH backend | `JWT_ALGORITHM` | No | Normally `HS256`. |
| OVH backend | `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access-token lifetime. |
| OVH backend | `CORS_ORIGINS` | Yes for browser clients | Exact comma-separated admin and donor-web origins. Current Vercel origins: `https://family-pledge-gaza-project.vercel.app,https://family-pledge-gaza-project-demo.vercel.app`. |
| OVH backend | `SQL_ECHO` | No | Keep `false` in production. |
| OVH backend | `DB_POOL_SIZE` | No | Current deployment template uses `5`. |
| OVH backend | `DB_MAX_OVERFLOW` | No | Current deployment template uses `10`. |
| OVH backend | `DB_POOL_TIMEOUT_SECONDS` | No | Current deployment template uses `30`. |
| OVH backend | `RUN_MIGRATIONS_ON_STARTUP` | Controlled deploy only | Use `true` only during a controlled migration/startup step; return to `false` after `/ready` confirms migrations are healthy. |
| OVH backend | `DEMO_SEED_ON_STARTUP` | Yes | Keep `false` in production. |
| OVH backend | `SENTRY_DSN` | Optional | Backend monitoring. |
| OVH backend | `SENTRY_TRACES_SAMPLE_RATE` | Optional | Tracing sample rate. |

## Frontends

| Service | Variable | Required | Production value / purpose |
|---|---|---:|---|
| Admin Vercel | `NEXT_PUBLIC_API_URL` | Yes | `https://api.familypledgekenya.org/api/v1` |
| Admin Vercel | `NEXT_IMAGE_REMOTE_HOSTNAMES` | Optional | Override for Next.js remote image hosts. Default source config includes `familypledgekenya.org`, YouTube image hosts. |
| Donor web Vercel | `EXPO_PUBLIC_API_URL` | Yes | `https://api.familypledgekenya.org/api/v1` |
| Native Expo/EAS | `EXPO_PUBLIC_API_URL` | Yes | `https://api.familypledgekenya.org/api/v1`; development, preview, and production profiles use the same production API unless intentionally overridden. |
| Native Expo/EAS | `EXPO_PUBLIC_EAS_PROJECT_ID` | Required for production push | EAS project UUID used when requesting Expo push tokens. |
| OVH backend | `EXPO_ACCESS_TOKEN` | Recommended for push | Backend-only Expo access token when enhanced push security is enabled. |

The donor web and native Android/iOS apps share the `frontend/mobile` codebase but receive environment variables through different deployment paths. Vercel builds the web export; EAS builds the native binaries.

## Cloudflare R2 public media

Production media bucket:

```text
family-pledge-media
```

Production public media base:

```text
https://familypledgekenya.org
```

| Service | Variable | Required | Production value / purpose |
|---|---|---:|---|
| OVH backend | `R2_ACCOUNT_ID` | Yes for uploads | Cloudflare account identifier. Backend only. |
| OVH backend | `R2_ACCESS_KEY_ID` | Yes for uploads | R2 access key with the required object permissions. Backend only. |
| OVH backend | `R2_SECRET_ACCESS_KEY` | Yes for uploads | Matching secret key. Backend only. |
| OVH backend | `R2_BUCKET_NAME` | Yes | `family-pledge-media` |
| OVH backend | `R2_PUBLIC_BASE_URL` | Yes | `https://familypledgekenya.org` |
| OVH backend | `R2_MAX_UPLOAD_MB` | No | Current ceiling `500`. |
| OVH backend | `R2_ALLOWED_UPLOADS_MODE` | No | Current deployment uses `broad`. |

R2 credentials must never use a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` prefix. Browser direct uploads also require an R2 CORS policy that allows the intended frontend origins and required headers.

## Cloudflare Stream

| Service | Variable | Required | Production value / purpose |
|---|---|---:|---|
| OVH backend | `STREAM_API_TOKEN` | Yes for video upload | Cloudflare Stream write token. Backend only. |
| OVH backend | `STREAM_CUSTOMER_CODE` | Yes for playback URLs | Customer code used for Stream delivery URLs. |
| OVH backend | `STREAM_MAX_DURATION_SECONDS` | No | Current deployment template uses `21600` seconds. |

## Private database backups to Cloudflare R2

Production private backup bucket:

```text
family-pledge-backup-db
```

This bucket must remain private and must not have a public custom domain.

| Service | Variable | Required | Production value / purpose |
|---|---|---:|---|
| OVH backup script | `AWS_DEFAULT_REGION` | Recommended | `auto` for Cloudflare R2 AWS CLI compatibility. |
| OVH backup script | `BACKUP_R2_ACCOUNT_ID` | Yes | Cloudflare account identifier for the backup credentials. |
| OVH backup script | `BACKUP_R2_ACCESS_KEY_ID` | Yes | Access key with Object Read & Write on the backup bucket. |
| OVH backup script | `BACKUP_R2_SECRET_ACCESS_KEY` | Yes | Matching secret key. |
| OVH backup script | `BACKUP_R2_BUCKET` | Yes | `family-pledge-backup-db` |
| OVH backup script | `BACKUP_R2_PREFIX` | No | `db` |
| OVH backup script | `BACKUP_KEEP_DAYS` | Policy setting | Current target `7`. Remote retention still needs a deliberate lifecycle/manual policy. |

## AI provider

The AI assistant remains backend-controlled, admin-only, and draft/suggest-only. Do not provide the model with database credentials.

| Service | Variable | Required | Purpose |
|---|---|---:|---|
| OVH backend | `OPENAI_API_KEY` | For AI | Backend-only key for the configured OpenAI-compatible provider. |
| OVH backend | `OPENAI_BASE_URL` | For OVH model endpoint | OVH OpenAI-compatible base URL. |
| OVH backend | `OPENAI_MODEL` | For AI | Current deployment target: `gpt-oss-120b`. |

## Email

Weekly email delivery should stay disabled until the SMTP provider and scheduler are verified end-to-end.

| Service | Variable | Required | Purpose |
|---|---|---:|---|
| OVH backend | `WEEKLY_EMAILS_ENABLED` | No | Keep `false` until email delivery is production-tested. |
| OVH backend | `EMAIL_PROVIDER` | If enabled | Provider label, currently `smtp`. |
| OVH backend | `SMTP_HOST` | If enabled | SMTP host. |
| OVH backend | `SMTP_PORT` | If enabled | SMTP port required by the selected provider. |
| OVH backend | `SMTP_USER` | If enabled | SMTP username. |
| OVH backend | `SMTP_PASSWORD` | If enabled | SMTP password/token. Backend only. |
| OVH backend | `EMAIL_FROM` | If enabled | Shell-safe sender string, e.g. `"Family Pledge <admin@familypledgekenya.org>"`. |

## Secret-handling rule

Real values for passwords, JWT secrets, R2 keys, Stream tokens, AI keys, SMTP credentials, and database credentials belong only in the deployment secret stores or the uncommitted OVH `.env`. Public API base URLs are not secrets.
