# Final Deployment Check — OVH / Cloudflare Production

## Current production state

The infrastructure cutover is substantially complete:

- Cloudflare proxies `api.familypledgekenya.org` to the OVH origin.
- Caddy terminates origin HTTPS and proxies to FastAPI.
- FastAPI is running in Docker on OVH.
- PostgreSQL is running in the same Compose stack.
- `/health` returns HTTP 200 publicly.
- `/ready` returns HTTP 200 with database connected and migrations healthy.
- A manual PostgreSQL backup has successfully uploaded to the private Cloudflare R2 bucket `family-pledge-backup-db`.
- The admin and donor-web frontends remain on Vercel for now.
- Railway remains online only as rollback/fallback while production data and application flows are verified on OVH.

Production API:

```text
https://api.familypledgekenya.org/api/v1
```

## Remaining launch blockers

### 1. Migrate existing Railway production data

The OVH database was initialized cleanly. Existing production admins/users and any required records must be migrated from Railway before Railway is retired.

Recommended sequence:

```bash
pg_dump "$RAILWAY_DATABASE_URL" | gzip > railway-familypledge.sql.gz
scp railway-familypledge.sql.gz ubuntu@<OVH_SERVER_IP>:/tmp/
cd ~/Family_Pledge_Gaza_Project/deploy/ovh
gunzip -c /tmp/railway-familypledge.sql.gz | docker compose exec -T postgres psql -U familypledge familypledge
docker compose exec backend alembic upgrade head
```

Then verify:

```bash
curl -i https://api.familypledgekenya.org/ready
```

### 2. Re-test authentication against OVH

After data migration:

- sign out of the admin web app so stale Railway JWTs are removed;
- sign back in against OVH;
- verify `POST /api/v1/auth/login` and `GET /api/v1/auth/me`;
- create a new donor account through the donor interface;
- verify `POST /api/v1/auth/register` reaches OVH and returns the expected response.

A 401 from a pre-cutover browser token does not prove the OVH auth code is broken; the token may have been signed with the old Railway JWT secret or the account may not yet exist in the clean OVH database.

### 3. Redeploy both Vercel frontends with the OVH API URL

Admin Vercel:

```env
NEXT_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

Donor Expo web Vercel:

```env
EXPO_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

The repository defaults and EAS profiles are also expected to point to this same API after the OVH configuration cleanup is merged.

### 4. Verify browser CORS

The OVH backend must allow the actual browser origins used in production. Current Vercel origins are:

```text
https://family-pledge-gaza-project.vercel.app
https://family-pledge-gaza-project-demo.vercel.app
```

Native Android/iOS calls are not browser CORS requests, but the Vercel admin and donor web builds are.

### 5. Test Cloudflare R2 through the real admin UI

Production public media configuration:

```text
Bucket: family-pledge-media
Public base: https://familypledgekenya.org
```

Test:

1. Log in to the admin dashboard against OVH.
2. Upload one normal image/file.
3. Confirm the object appears in `family-pledge-media`.
4. Confirm the returned URL renders correctly in the admin/user interface.
5. Confirm browser direct upload is not blocked by R2 CORS.

### 6. Test Cloudflare Stream through the real admin UI

Upload one short video and verify:

- the backend creates a Stream direct-upload request;
- the upload succeeds;
- the asset appears in Cloudflare Stream;
- processing completes;
- playback/thumbnail URLs work in the UI.

Large-video resumable upload behavior should also be tested before relying on it for production media.

### 7. Production database backups

The manual backup path has been proven end-to-end:

```text
PostgreSQL -> gzip dump -> private R2 bucket
```

Private bucket:

```text
family-pledge-backup-db
```

Cloudflare R2 AWS CLI region must be valid; use:

```env
AWS_DEFAULT_REGION=auto
```

or:

```bash
aws configure set region auto
```

After manual verification, schedule the backup job, for example:

```cron
0 2 * * * cd /home/ubuntu/Family_Pledge_Gaza_Project/deploy/ovh && bash scripts/backup_db_to_r2.sh >> /var/log/familypledge-db-backup.log 2>&1
```

Do not expose the backup bucket publicly.

### 8. Disable automatic startup migrations after controlled migration

Once the production database migration is complete and `/ready` confirms migrations are healthy:

```env
RUN_MIGRATIONS_ON_STARTUP=false
```

Then recreate/restart the backend container deliberately.

### 9. Native Android/iOS release checks

Before Play Store or App Store submission:

- production EAS builds must use `https://api.familypledgekenya.org/api/v1`;
- verify Android package and iOS bundle identifier remain `org.namlef.familypledge`;
- confirm EAS project configuration and production credentials;
- test registration, login, contribution submission, image proof upload, push-token registration, and major screens on a real Android build;
- repeat the functional test on iOS before App Store submission;
- complete store privacy/data-safety metadata, screenshots, support URL, and age/content ratings.

### 10. AI and email status

AI remains backend-mediated and admin-only. Draft/suggest behavior must continue to require human review for publishing or operational actions.

Keep weekly email delivery disabled until the SMTP provider and scheduler are verified:

```env
WEEKLY_EMAILS_ENABLED=false
```

## Production acceptance checklist

Do not retire Railway until all applicable checks below pass:

- [x] Public `/health` returns HTTP 200.
- [x] Public `/ready` returns HTTP 200.
- [x] OVH PostgreSQL is reachable from FastAPI.
- [x] Alembic migrations are healthy on the current OVH database.
- [x] Manual private R2 database backup succeeds.
- [ ] Existing Railway production data restored and verified on OVH.
- [ ] Admin login works against OVH using migrated/current credentials.
- [ ] New donor registration works through the donor web UI.
- [ ] Donor login works against OVH.
- [ ] Admin Vercel deployment uses the OVH API URL.
- [ ] Donor Vercel deployment uses the OVH API URL.
- [ ] Browser CORS passes for both Vercel origins.
- [ ] R2 image/file upload works through the admin UI.
- [ ] Cloudflare Stream video upload/playback works through the admin UI.
- [ ] Contribution submit/review flow works.
- [ ] Campaign/project/impact/reminder/NAMLEF flows work.
- [ ] Native Android production build is tested against OVH.
- [ ] Native iOS production build is tested against OVH.

## Railway retirement rule

Railway is not the primary production backend anymore. Keep it available only until the OVH database contains the required production records and all critical user/admin/media flows have passed. After a deliberate stability window and verified rollback-independent backups, Railway can be shut down.
