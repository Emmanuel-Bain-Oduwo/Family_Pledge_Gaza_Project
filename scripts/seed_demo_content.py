#!/usr/bin/env python3
"""
Seed the database with demo content for development / staging environments.
Controlled by ALLOW_DEMO_SEED_IN_PRODUCTION to optionally allow in production.
"""

import sys

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User
# Import other models as needed for your seeding logic

def main():
    if not getattr(settings, "ALLOW_DEMO_SEED_IN_PRODUCTION", False):
        print("ERROR: Seeding is not allowed. Set ALLOW_DEMO_SEED_IN_PRODUCTION=True to enable.")
        sys.exit(1)

    db = SessionLocal()
    try:
        # Example: create a demo user
        if not db.query(User).filter(User.email == "demo@example.com").first():
            demo_user = User(
                email="demo@example.com",
                full_name="Demo User",
                # other fields as required
            )
            db.add(demo_user)
            db.commit()
            print("Demo user created.")
        else:
            print("Demo user already exists.")

        # Add further seeding logic here

    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
