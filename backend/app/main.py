from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
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
def readiness_check():
    return {
        "status": "ready",
        "service": "family-pledge-api",
        "cors_origins_configured": len(settings.cors_origins_list),
    }
