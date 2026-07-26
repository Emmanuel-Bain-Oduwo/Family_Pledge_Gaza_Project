# Cloudflare R2 Storage Policy

Cloudflare R2 is the production file and media store for Family Pledge. Cloudinary is deprecated and must not be used for new production uploads.

## Supported content

Owners and administrators may upload images, videos, audio, PDFs, office documents, CSV/text files, and other recognized media. Videos are supported directly and are not restricted to YouTube. The broad policy blocks executable and server-side extensions such as `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.js`, `.html`, `.py`, `.jar`, `.msi`, `.apk`, and `.ipa`.

`R2_MAX_UPLOAD_MB` is a configurable safety ceiling (500 MB by default), not a small product limit. `R2_ALLOWED_UPLOADS_MODE` is reserved for selectable policy modes and defaults to `broad`.

## Upload and content flow

1. An authenticated administrator selects a file.
2. The admin client requests a short-lived presigned PUT URL from `POST /api/v1/admin/storage/r2-presigned-upload`.
3. The browser uploads bytes directly to R2. Large bytes never pass through the backend API.
4. The client confirms metadata through `POST /api/v1/admin/storage/r2-confirm-upload`.
5. The upload URL is placed in the campaign, project, impact, reminder, or NAMLEF form field and saved with that record.
6. PostgreSQL stores only the public URL, R2 object key, metadata, and usage record—never raw file bytes.
7. Public APIs return the saved URL and the user application renders or links it. Contribution proofs remain private and are not included in public APIs.

The `media_assets` table tracks file count, declared object size, content type, folder, uploader, status, and related entity when known. The admin Storage Usage page is operational metadata; the Cloudflare dashboard remains the final source of truth for billing, requests, bandwidth, and stored bytes.

## Object naming and access

Objects use `family-pledge/<folder>/<yyyy>/<mm>/<uuid>-<sanitized-filename>`. Filenames are sanitized, extensions normalized to lowercase, and UUIDs prevent collisions. Public content uses the absolute custom-domain URL configured in `R2_PUBLIC_BASE_URL`.

R2 access keys are backend-only secrets. Never add them to frontend code or a `NEXT_PUBLIC_*` variable. Presigned URLs expire after 15 minutes. Admin authorization is required to sign, confirm, and inspect usage.

## Cloudflare setup

1. Create a Cloudflare R2 bucket.
2. Create an R2 API token limited to that bucket.
3. Attach a public custom domain, for example `media.familypledge.org`.
4. Set `R2_PUBLIC_BASE_URL=https://media.familypledge.org`.
5. Configure bucket CORS to allow production and local admin origins to `PUT`, with `Content-Type` allowed. Example:

```json
[{"AllowedOrigins":["https://admin.familypledge.org","http://localhost:3000"],"AllowedMethods":["PUT"],"AllowedHeaders":["Content-Type"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]
```

6. Put account ID, access key, and secret access key only in the backend environment.
7. Verify uploads and public delivery, then monitor final usage and billing in Cloudflare.
