# Cloudflare R2 and Stream Storage Policy

Cloudflare R2 stores images, audio, PDFs, documents, contribution-related media where permitted, and other general files. Cloudflare Stream is the production video platform for encoded playback and generated thumbnails. Cloudinary is not a production dependency.

## Production storage targets

Public media bucket:

```text
family-pledge-media
```

Public media base URL:

```text
https://familypledgekenya.org
```

Private database-backup bucket:

```text
family-pledge-backup-db
```

The backup bucket must remain private and must not have a public custom domain.

## Supported content

Owners and administrators may upload recognized images, video, audio, PDFs, office documents, CSV/text files, and other approved media. Videos are stored in Cloudflare Stream rather than R2.

The broad upload policy blocks executable or server-side file types such as `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.js`, `.html`, `.py`, `.jar`, `.msi`, `.apk`, and `.ipa`.

`R2_MAX_UPLOAD_MB` is a configurable safety ceiling and currently defaults to 500 MB. `R2_ALLOWED_UPLOADS_MODE` defaults to `broad`.

## Upload and content flow

1. An authenticated administrator selects a file.
2. Non-video files request an R2 presigned PUT; videos request a Stream direct-upload URL.
3. The browser uploads bytes directly to R2 or Stream rather than proxying large payloads through FastAPI.
4. The client confirms the uploaded object/asset through the corresponding backend confirmation endpoint.
5. The returned URL is stored with the relevant campaign, project, impact card, reminder, or NAMLEF record.
6. PostgreSQL stores URLs, object identifiers, metadata, and usage records rather than raw media bytes.
7. Public application APIs return only media that is intended to be public.

Contribution proof media is sensitive and must not be exposed through public content APIs. Access-control behavior for contribution proofs must be tested independently before production release.

## R2 object naming and metadata

R2 objects use versioned keys similar to:

```text
family-pledge/<folder>/<yyyy>/<mm>/<uuid>-<sanitized-filename>
```

Filenames are sanitized and UUIDs prevent collisions. Public URLs use the absolute base configured by:

```env
R2_PUBLIC_BASE_URL=https://familypledgekenya.org
```

R2 credentials are backend-only secrets. Never place them in frontend code, `NEXT_PUBLIC_*`, or `EXPO_PUBLIC_*` variables.

Presigned upload URLs are time-limited. Admin authorization is required to request signing/confirmation and storage-usage data.

## Production R2 configuration

Backend-only variables:

```env
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<secret>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET_NAME=family-pledge-media
R2_PUBLIC_BASE_URL=https://familypledgekenya.org
R2_MAX_UPLOAD_MB=500
R2_ALLOWED_UPLOADS_MODE=broad
```

Use an R2 API token with only the permissions and bucket scope required by the application.

## Browser CORS for direct R2 uploads

The admin browser uploads directly to R2 after requesting a presigned URL from the backend. R2 therefore needs a CORS policy that includes the real browser origins and required methods/headers.

Current production browser origins include:

```text
https://family-pledge-gaza-project.vercel.app
https://family-pledge-gaza-project-demo.vercel.app
```

A representative R2 CORS policy is:

```json
[
  {
    "AllowedOrigins": [
      "https://family-pledge-gaza-project.vercel.app",
      "https://family-pledge-gaza-project-demo.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "Cache-Control"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Use only the origins and headers that the actual upload flow requires. Test browser uploads after every CORS change.

## Cloudflare Stream

Backend-only variables:

```env
STREAM_API_TOKEN=<secret>
STREAM_CUSTOMER_CODE=<customer-code>
STREAM_MAX_DURATION_SECONDS=21600
```

The Stream API token must never be exposed to the admin or donor frontend. The backend creates one-time upload instructions; the browser sends the video directly to Stream.

For smaller files, the admin uses the simple direct-upload path. Larger videos use the resumable tus flow implemented by the admin media client. Both paths must be tested before production reliance.

Stream provides playback and thumbnail URLs that can be stored with the application record.

## Private PostgreSQL backups

Database backups use a separate R2 credential and bucket:

```env
AWS_DEFAULT_REGION=auto
BACKUP_R2_ACCOUNT_ID=<cloudflare-account-id>
BACKUP_R2_ACCESS_KEY_ID=<secret>
BACKUP_R2_SECRET_ACCESS_KEY=<secret>
BACKUP_R2_BUCKET=family-pledge-backup-db
BACKUP_R2_PREFIX=db
BACKUP_KEEP_DAYS=7
```

The backup token must have the required Object Read & Write permission on `family-pledge-backup-db`. It does not need a public base URL because backup objects are intentionally private.

Manual backup verification:

```bash
cd deploy/ovh
bash scripts/backup_db_to_r2.sh
```

## Verification checklist

Before production launch:

- confirm an admin image upload reaches R2;
- confirm the object appears in `family-pledge-media`;
- confirm the returned public media URL renders correctly;
- confirm browser CORS allows the intended upload request;
- confirm a short video upload appears and processes in Stream;
- test the resumable Stream path for a larger file;
- verify contribution-proof privacy behavior;
- verify a PostgreSQL backup reaches `family-pledge-backup-db`;
- confirm no R2/Stream secret is present in frontend bundles or public environment variables.

Cloudflare remains the source of truth for actual stored bytes, requests, bandwidth, Stream usage, and billing.
