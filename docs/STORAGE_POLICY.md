# Media Storage Policy — Family Pledge for Gaza

## Overview

Family Pledge uses two media storage approaches depending on content type:

| Content Type | Storage | Limit |
|-------------|---------|-------|
| Images (project covers, reminders, impact cards, NAMLEF thumbnails) | Cloudinary (free tier) | 25 GB free |
| Short videos (≤ 30 seconds) | Cloudinary | 25 GB free |
| Long videos (> 30 seconds) | YouTube (unlisted) | Unlimited |
| Documents / proof files | Cloudinary | 25 GB free |

---

## Cloudinary

### Why Cloudinary?

- Free tier provides 25 GB storage and 25 GB bandwidth/month — sufficient for Phase 1
- Signed uploads prevent unauthorised access to the upload endpoint
- Automatic image optimisation and format conversion (WebP, AVIF)
- Fast CDN delivery globally

### How Uploads Work

1. Admin selects an image in the dashboard
2. Browser requests a signed upload signature from the backend (`POST /admin/storage/cloudinary-signature`)
3. Backend generates a HMAC-SHA1 signature using the `CLOUDINARY_API_SECRET`
4. Browser uploads directly to Cloudinary using the signed form data
5. Cloudinary returns the `secure_url` — this URL is saved in the database

This flow ensures the API secret is never exposed to the browser.

### Folder Structure

```
family-pledge/
├── projects/      ← project cover images
├── reminders/     ← reminder background images
├── namlef/        ← NAMLEF speaker thumbnails and media
└── impact/        ← impact story images and short videos
```

### Accepted File Types

| Type | Formats |
|------|---------|
| Images | JPEG, PNG, WebP, GIF |
| Videos | MP4, MOV, WebM (≤ 30s for Cloudinary) |

### URL Format

All Cloudinary URLs begin with:
```
https://res.cloudinary.com/<cloud_name>/image/upload/...
https://res.cloudinary.com/<cloud_name>/video/upload/...
```

The admin frontend validates URLs against this pattern before saving.

---

## YouTube

### Why YouTube for Long Videos?

- No storage cost
- Reliable streaming globally
- Works on all mobile devices

### Policy

- All videos must be uploaded as **Unlisted** (not Public) to maintain controlled distribution
- Videos should not include any content that violates YouTube's Terms of Service
- The admin frontend validates YouTube URLs and accepts:
  - `https://www.youtube.com/watch?v=...`
  - `https://youtu.be/...`
  - `https://www.youtube.com/embed/...`
  - `https://www.youtube.com/shorts/...`

### Mobile Playback

On the mobile app, YouTube videos open in the device's browser or YouTube app via `Linking.openURL()`.

---

## Security

### Signed Uploads

Cloudinary upload signatures expire after 1 hour. Each signature is tied to a specific upload folder, preventing uploads to unauthorized folders.

### URL Validation

Before saving any media URL to the database, the backend validates it is either:
- A valid Cloudinary URL (`res.cloudinary.com`)
- A valid YouTube URL (recognised patterns above)

Arbitrary URLs cannot be saved as media fields — this prevents link injection attacks.

### No Sensitive Data in Media

- Media files must not contain personal donor information
- Field reports containing personally identifiable information should be stored securely outside the app
- Contribution proof images (receipts) are stored in Cloudinary but accessible only via the admin dashboard

---

## Phase 2 Upgrades

When Phase 1 storage limits are approached:

1. **Cloudinary paid plan** — starting at $89/month for 225 GB
2. **Amazon S3 + CloudFront** — more cost-effective at scale, requires migration
3. **Self-hosted MinIO** — for maximum control and minimal cost

No changes to the application code are required for a Cloudinary plan upgrade (only the API keys change).
