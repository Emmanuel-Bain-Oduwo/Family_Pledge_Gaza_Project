#!/usr/bin/env python3
import sys
import os

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User

def main():
    if settings.APP_ENV == "production":
        allow_seed = os.environ.get("ALLOW_DEMO_SEED_IN_PRODUCTION", "").lower() == "true"
        if not allow_seed:
            print("ERROR: Seeding in production is strictly blocked unless ALLOW_DEMO_SEED_IN_PRODUCTION=true is set.")
            sys.exit(1)

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "demo@example.com").first():
            demo_user = User(email="demo@example.com", full_name="Demo User")
            db.add(demo_user)
            db.commit()
            print("Demo user created.")
        else:
            print("Demo user already exists.")
    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
