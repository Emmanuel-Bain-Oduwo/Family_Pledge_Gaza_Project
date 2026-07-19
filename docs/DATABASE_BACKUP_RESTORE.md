# Railway PostgreSQL Backup & Restore

**WARNING: NEVER RESTORE A BACKUP DIRECTLY OVER PRODUCTION DATA WITHOUT EXPLICIT APPROVAL.**

1. **Enable Backups**: Confirm Railway Automated Backups are enabled in the database settings.
2. **Manual Dump**: 
   `pg_dump -d "$DATABASE_URL" -Fc -f backup.dump`
3. **Local Restore**: 
   `pg_restore -d "postgresql://postgres:password@localhost:5432/local_db" backup.dump`
4. **Emergency Restore**: Provision a new Railway DB service, restore the dump there, and update the backend's `DATABASE_URL` environment variable.
