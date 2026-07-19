import logging

import sentry_sdk
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import engine
from app.api.routes import (
    admin,
    ai_assistant,
    auth,
    campaigns,
    collectors,
    contributions,
    daily_reminders,
    impact_cards,
    mobile,
    namlef_content,
    notifications,
    pledges,
    projects,
    settings as settings_routes,
    storage,
    users,
)

logger = logging.getLogger(__name__)

# Sentry initialization
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        environment=settings.APP_ENV,
    )
    logger.info("Sentry initialized (environment: %s)", settings.APP_ENV)
else:
    logger.warning("SENTRY_DSN not set – monitoring disabled")

CORE_TABLES = (
    "users",
    "campaigns",
    "projects",
    "daily_reminders",
    "app_settings",
    "contributions",
    "pledges",
)

app = FastAPI(
    title="Family Pledge API",
    description="Family Pledge / NAMLEF Gaza Family Support backend for pledge signing, awareness content, contributions, reminders, collectors, and admin operations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Unhandled database error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Database operation failed"},
    )

ROUTERS = (
    mobile.router,
    auth.router,
    users.router,
    pledges.router,
    contributions.router,
    campaigns.router,
    projects.router,
    impact_cards.router,
    daily_reminders.router,
    namlef_content.router,
    collectors.router,
    notifications.router,
    ai_assistant.router,
    settings_routes.router,
    storage.router,
    admin.router,
)

for router in ROUTERS:
    app.include_router(router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "api_prefix": settings.API_V1_PREFIX,
    }


@app.get("/ready", tags=["Health"])
def readiness_check(response: Response):
    database_status = "failed"
    migrations_status = "missing_tables"
    missing_tables = list(CORE_TABLES)

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            database_status = "connected"

            existing_tables = set(inspect(connection).get_table_names())
            missing_tables = [table for table in CORE_TABLES if table not in existing_tables]
            migrations_status = "ok" if not missing_tables else "missing_tables"
    except SQLAlchemyError:
        logger.exception("Readiness check failed while checking database state")

    status = (
        "ready"
        if database_status == "connected" and migrations_status == "ok"
        else "unavailable"
    )
    response.status_code = 200 if status == "ready" else 503

    return {
        "status": status,
        "database": database_status,
        "migrations": migrations_status,
        "missing_tables": missing_tables,
    }
