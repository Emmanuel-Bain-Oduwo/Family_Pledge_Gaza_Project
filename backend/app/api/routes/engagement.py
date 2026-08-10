from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.engagement import FeatureRequest
from app.models.user import User
from app.schemas.engagement import (
    AchievementOut,
    CircleCreate,
    CircleDetailOut,
    CircleJoin,
    CircleOut,
    EngagementEventCreate,
    FeatureRequestCreate,
    FeatureRequestOut,
    FeatureRequestStatusUpdate,
    GoalCreate,
    GoalOut,
    GoalUpdate,
    ImpactJourneyOut,
)
from app.schemas.common import MessageResponse
from app.services import engagement_service

router = APIRouter(prefix="/engagement", tags=["Engagement"])


@router.get("/journey", response_model=ImpactJourneyOut)
def journey(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.impact_journey(db, current_user)


@router.get("/achievements", response_model=list[AchievementOut])
def achievement_list(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.achievements(db, current_user)


@router.get("/goals", response_model=list[GoalOut])
def goal_list(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.list_goals(db, current_user)


@router.post("/goals", response_model=GoalOut, status_code=201)
def goal_create(data: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.create_goal(db, current_user, data)


@router.patch("/goals/{goal_id}", response_model=GoalOut)
def goal_update(goal_id: UUID, data: GoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.update_goal(db, current_user, goal_id, data)


@router.post("/events", response_model=MessageResponse, status_code=201)
def event_create(data: EngagementEventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    engagement_service.record_event(
        db,
        current_user,
        event_type=data.event_type,
        entity_type=data.entity_type,
        entity_id=data.entity_id,
    )
    return MessageResponse(message="Activity recorded")


@router.get("/circles", response_model=list[CircleOut])
def circle_list(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.list_circles(db, current_user)


@router.post("/circles", response_model=CircleOut, status_code=201)
def circle_create(data: CircleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    circle = engagement_service.create_circle(db, current_user, data)
    return engagement_service.circle_out(db, current_user, circle)


@router.post("/circles/join", response_model=CircleOut)
def circle_join(data: CircleJoin, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    circle = engagement_service.join_circle(db, current_user, data.code)
    return engagement_service.circle_out(db, current_user, circle)


@router.get("/circles/{circle_id}", response_model=CircleDetailOut)
def circle_detail(circle_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.get_circle(db, current_user, circle_id)


@router.delete("/circles/{circle_id}/leave", response_model=MessageResponse)
def circle_leave(circle_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    engagement_service.leave_circle(db, current_user, circle_id)
    return MessageResponse(message="You left the Pledge Circle")


@router.post("/feature-requests", response_model=FeatureRequestOut, status_code=201)
def feature_request(data: FeatureRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return engagement_service.create_feature_request(db, current_user, data)


@router.get("/feature-requests", response_model=list[FeatureRequestOut])
def feature_request_list(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return list(db.scalars(select(FeatureRequest).order_by(FeatureRequest.created_at.desc()).limit(250)).all())


@router.patch("/feature-requests/{request_id}", response_model=FeatureRequestOut)
def feature_request_update(
    request_id: UUID,
    data: FeatureRequestStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    request = db.get(FeatureRequest, request_id)
    if request is None:
        raise HTTPException(404, "Feature request not found")
    request.status = data.status
    db.commit()
    db.refresh(request)
    return request
