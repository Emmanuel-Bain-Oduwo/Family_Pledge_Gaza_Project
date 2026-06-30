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

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(pledges.router)
app.include_router(contributions.router)
app.include_router(campaigns.router)
app.include_router(projects.router)
app.include_router(impact_cards.router)
app.include_router(daily_reminders.router)
app.include_router(namlef_content.router)
app.include_router(collectors.router)
app.include_router(notifications.router)
app.include_router(ai_assistant.router)
app.include_router(storage.router)
app.include_router(admin.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}
