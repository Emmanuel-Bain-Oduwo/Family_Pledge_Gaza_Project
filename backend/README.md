# Family Pledge — Backend

FastAPI + SQLAlchemy 2.x + Alembic + PostgreSQL.

---

## Requirements

- Python 3.11+
- PostgreSQL 15+

```bash
pip install -r requirements.txt
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/familypledge` | PostgreSQL connection string |
| `SQL_ECHO` | `false` | Set `true` to log all SQL statements |

---

## Database migrations (Alembic)

All migration commands must be run from the `backend/` directory.

### Apply all migrations (bring DB up to latest)

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname alembic upgrade head
```

### Check current migration version

```bash
alembic current
```

### View migration history

```bash
alembic history --verbose
```

### Generate a new migration after changing models

```bash
alembic revision --autogenerate -m "describe_your_change"
```

Review the generated file in `alembic/versions/` before applying.

### Roll back the last migration

```bash
alembic downgrade -1
```

### Roll back to a specific revision

```bash
alembic downgrade <revision_id>
```

### Roll back all migrations (empty database)

```bash
alembic downgrade base
```

---

## Seed the first super admin

Run once after the first `alembic upgrade head`:

```bash
ADMIN_FULL_NAME="Your Name" \
ADMIN_EMAIL="admin@example.com" \
ADMIN_PHONE="+256700000000" \
ADMIN_PASSWORD="choose-a-strong-password" \
DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
python scripts/seed_super_admin.py
```

The script is idempotent — running it again with the same email does nothing.

---

## Running the API server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Project structure

```
backend/
├── alembic/
│   ├── env.py                  # Alembic runtime config
│   ├── script.py.mako          # Migration template
│   └── versions/
│       └── 0001_initial_schema.py
├── app/
│   ├── core/
│   │   └── database.py         # SQLAlchemy engine + get_db()
│   └── models/
│       ├── base.py             # Base, TimestampMixin, SoftDeleteMixin
│       ├── enums.py            # All SQLAlchemy/Python enums
│       ├── user.py
│       ├── campaign.py
│       ├── pledge.py
│       ├── contribution.py
│       ├── project.py
│       ├── impact.py
│       ├── reminder.py
│       ├── notification.py
│       ├── collector.py
│       ├── namlef.py
│       ├── badge.py
│       ├── ai_draft.py
│       ├── audit.py
│       └── __init__.py
├── scripts/
│   └── seed_super_admin.py
├── alembic.ini
└── requirements.txt
```
