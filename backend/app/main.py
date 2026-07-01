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
    storage,
    users,
)

app = FastAPI(
    title="Family Pledge API",
    description="NAMLEF-linked humanitarian app backend for Gaza relief fundraising.",
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
    storage.router,
    admin.router,
)

for router in ROUTERS:
    app.include_router(router, prefix=settings.API_V1_PREFIX)
    app.include_router(router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}
