from __future__ import annotations

import secrets
import string
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.campaign import Campaign
from app.models.contribution import Contribution
from app.models.engagement import (
    EngagementEvent,
    EngagementGoal,
    FeatureRequest,
    PledgeCircle,
    PledgeCircleMember,
)
from app.models.enums import ContributionStatus, PledgeStatus
from app.models.pledge import Pledge
from app.models.user import User
from app.schemas.engagement import CircleCreate, FeatureRequestCreate, GoalCreate, GoalUpdate
from app.services.user_service import get_display_name


def _current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _month_index(value: str) -> int:
    year, month = map(int, value.split("-"))
    return year * 12 + month


def _month_streak(months: list[str]) -> tuple[int, int]:
    indexes = sorted({_month_index(value) for value in months})
    if not indexes:
        return 0, 0
    longest = 1
    run = 1
    for previous, current in zip(indexes, indexes[1:]):
        if current == previous + 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1
    current_idx = _month_index(_current_month())
    latest = indexes[-1]
    if latest not in (current_idx, current_idx - 1):
        return 0, longest
    current_run = 1
    for pos in range(len(indexes) - 1, 0, -1):
        if indexes[pos] == indexes[pos - 1] + 1:
            current_run += 1
        else:
            break
    return current_run, longest


def _event_count(db: Session, user_id: UUID, event_type: str) -> int:
    return int(
        db.scalar(
            select(func.count(EngagementEvent.id)).where(
                EngagementEvent.user_id == user_id,
                EngagementEvent.event_type == event_type,
            )
        )
        or 0
    )


def _distinct_event_count(db: Session, user_id: UUID, event_type: str) -> int:
    return int(
        db.scalar(
            select(func.count(distinct(EngagementEvent.entity_id))).where(
                EngagementEvent.user_id == user_id,
                EngagementEvent.event_type == event_type,
            )
        )
        or 0
    )


def impact_journey(db: Session, user: User) -> dict:
    confirmed = list(
        db.scalars(
            select(Contribution).where(
                Contribution.user_id == user.id,
                Contribution.status == ContributionStatus.confirmed,
            )
        ).all()
    )
    current_streak, longest_streak = _month_streak(
        [item.contribution_month for item in confirmed]
    )
    pledge_since = db.scalar(
        select(func.min(Pledge.start_date)).where(Pledge.user_id == user.id)
    )
    campaigns_supported = int(
        db.scalar(
            select(func.count(distinct(Contribution.campaign_id))).where(
                Contribution.user_id == user.id,
                Contribution.status == ContributionStatus.confirmed,
                Contribution.campaign_id.is_not(None),
            )
        )
        or 0
    )
    circles_joined = int(
        db.scalar(
            select(func.count(PledgeCircleMember.id)).where(
                PledgeCircleMember.user_id == user.id
            )
        )
        or 0
    )
    return {
        "current_consistency_months": current_streak,
        "longest_consistency_months": longest_streak,
        "confirmed_contributions": len(confirmed),
        "pledge_since": pledge_since,
        "campaigns_supported": campaigns_supported,
        "impact_updates_viewed": _distinct_event_count(db, user.id, "impact_viewed"),
        "campaigns_shared": _event_count(db, user.id, "campaign_shared"),
        "circles_joined": circles_joined,
    }


def achievements(db: Session, user: User) -> list[dict]:
    journey = impact_journey(db, user)
    active_pledge = bool(
        db.scalar(
            select(Pledge.id).where(
                Pledge.user_id == user.id,
                Pledge.status == PledgeStatus.active,
            ).limit(1)
        )
    )
    friday_contributions = int(
        db.scalar(
            select(func.count(Contribution.id)).where(
                Contribution.user_id == user.id,
                Contribution.status == ContributionStatus.confirmed,
                func.extract("dow", Contribution.confirmed_at) == 5,
            )
        )
        or 0
    )
    circle_members_invited = int(
        db.scalar(
            select(func.count(PledgeCircleMember.id))
            .join(PledgeCircle, PledgeCircle.id == PledgeCircleMember.circle_id)
            .where(
                PledgeCircle.owner_user_id == user.id,
                PledgeCircleMember.role == "member",
            )
        )
        or 0
    )
    values = {
        "first_pledge": 1 if active_pledge or journey["confirmed_contributions"] else 0,
        "community_builder": circle_members_invited,
        "three_months": journey["longest_consistency_months"],
        "impact_supporter": journey["impact_updates_viewed"],
        "six_months": journey["longest_consistency_months"],
        "friday_supporter": friday_contributions,
        "family_builder": circle_members_invited,
        "one_year": journey["longest_consistency_months"],
    }
    catalog = [
        ("first_pledge", "First Family Pledge", "Sign your first pledge or complete your first confirmed contribution.", "heart", 1),
        ("community_builder", "Community Builder", "Welcome 3 members into a Pledge Circle you created.", "people", 3),
        ("three_months", "3 Months Consistent", "Build a three-month confirmed contribution streak.", "ribbon", 3),
        ("impact_supporter", "Impact Supporter", "Read 5 verified Family Pledge impact updates.", "sparkles", 5),
        ("six_months", "6 Months Consistent", "Build a six-month confirmed contribution streak.", "medal", 6),
        ("friday_supporter", "Friday Supporter", "Complete 4 confirmed Friday contributions.", "calendar", 4),
        ("family_builder", "Family Builder", "Welcome 10 members into your Pledge Circles.", "home", 10),
        ("one_year", "One Year Journey", "Build a twelve-month confirmed contribution streak.", "trophy", 12),
    ]
    return [
        {
            "key": key,
            "name": name,
            "description": description,
            "icon": icon,
            "earned": values[key] >= target,
            "progress": min(values[key], target),
            "target": target,
        }
        for key, name, description, icon, target in catalog
    ]


def _goal_progress(db: Session, user: User, goal: EngagementGoal) -> int:
    if goal.goal_type == "monthly_pledge":
        return int(
            bool(
                db.scalar(
                    select(Pledge.id).where(
                        Pledge.user_id == user.id,
                        Pledge.status == PledgeStatus.active,
                    ).limit(1)
                )
            )
        )
    if goal.goal_type == "friday_contribution":
        return int(
            db.scalar(
                select(func.count(Contribution.id)).where(
                    Contribution.user_id == user.id,
                    Contribution.status == ContributionStatus.confirmed,
                    func.extract("dow", Contribution.confirmed_at) == 5,
                    Contribution.created_at >= goal.created_at,
                )
            )
            or 0
        )
    if goal.goal_type == "share_campaign":
        return _event_count(db, user.id, "campaign_shared")
    if goal.goal_type == "read_impact":
        return _distinct_event_count(db, user.id, "impact_viewed")
    if goal.goal_type == "invite_family":
        return int(
            db.scalar(
                select(func.count(PledgeCircleMember.id))
                .join(PledgeCircle, PledgeCircle.id == PledgeCircleMember.circle_id)
                .where(
                    PledgeCircle.owner_user_id == user.id,
                    PledgeCircleMember.role == "member",
                    PledgeCircleMember.joined_at >= goal.created_at,
                )
            )
            or 0
        )
    if goal.goal_type == "support_campaign":
        return int(
            db.scalar(
                select(func.count(distinct(Contribution.campaign_id))).where(
                    Contribution.user_id == user.id,
                    Contribution.status == ContributionStatus.confirmed,
                    Contribution.campaign_id.is_not(None),
                    Contribution.created_at >= goal.created_at,
                )
            )
            or 0
        )
    if goal.goal_type == "humanitarian_action":
        return _event_count(db, user.id, "humanitarian_action_completed")
    return goal.current_count


def list_goals(db: Session, user: User) -> list[EngagementGoal]:
    goals = list(
        db.scalars(
            select(EngagementGoal)
            .where(EngagementGoal.user_id == user.id)
            .order_by(EngagementGoal.created_at.desc())
        ).all()
    )
    changed = False
    for goal in goals:
        progress = _goal_progress(db, user, goal)
        if progress != goal.current_count:
            goal.current_count = progress
            changed = True
        if goal.status == "active" and progress >= goal.target_count:
            goal.status = "completed"
            changed = True
    if changed:
        db.commit()
    return goals


def create_goal(db: Session, user: User, data: GoalCreate) -> EngagementGoal:
    goal = EngagementGoal(
        user_id=user.id,
        goal_type=data.goal_type,
        title=data.title.strip(),
        target_count=data.target_count,
        cadence=data.cadence,
        starts_on=data.starts_on or date.today(),
        ends_on=data.ends_on,
        status="active",
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_goal(db: Session, user: User, goal_id: UUID, data: GoalUpdate) -> EngagementGoal:
    goal = db.scalar(
        select(EngagementGoal).where(
            EngagementGoal.id == goal_id,
            EngagementGoal.user_id == user.id,
        )
    )
    if not goal:
        raise HTTPException(404, "Goal not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return goal


def record_event(
    db: Session,
    user: User,
    event_type: str,
    entity_type: str | None = None,
    entity_id: UUID | None = None,
) -> EngagementEvent:
    if event_type in {"impact_viewed", "tutorial_viewed"} and entity_id:
        existing = db.scalar(
            select(EngagementEvent).where(
                EngagementEvent.user_id == user.id,
                EngagementEvent.event_type == event_type,
                EngagementEvent.entity_id == entity_id,
            )
        )
        if existing:
            return existing
    event = EngagementEvent(
        user_id=user.id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def _new_circle_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(secrets.choice(alphabet) for _ in range(8))
        if not db.scalar(select(PledgeCircle.id).where(PledgeCircle.invite_code == code)):
            return code
    raise HTTPException(503, "Could not create a unique circle code")


def create_circle(db: Session, user: User, data: CircleCreate) -> PledgeCircle:
    circle = PledgeCircle(
        owner_user_id=user.id,
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        invite_code=_new_circle_code(db),
        is_active=True,
    )
    db.add(circle)
    db.flush()
    db.add(PledgeCircleMember(circle_id=circle.id, user_id=user.id, role="owner"))
    db.commit()
    db.refresh(circle)
    return circle


def join_circle(db: Session, user: User, code: str) -> PledgeCircle:
    circle = db.scalar(
        select(PledgeCircle).where(
            PledgeCircle.invite_code == code.strip().upper(),
            PledgeCircle.is_active.is_(True),
        )
    )
    if not circle:
        raise HTTPException(404, "Pledge Circle code not found")
    existing = db.scalar(
        select(PledgeCircleMember).where(
            PledgeCircleMember.circle_id == circle.id,
            PledgeCircleMember.user_id == user.id,
        )
    )
    if not existing:
        db.add(PledgeCircleMember(circle_id=circle.id, user_id=user.id, role="member"))
        db.commit()
    return circle


def leave_circle(db: Session, user: User, circle_id: UUID) -> None:
    circle = db.get(PledgeCircle, circle_id)
    if not circle:
        raise HTTPException(404, "Pledge Circle not found")
    if circle.owner_user_id == user.id:
        raise HTTPException(400, "Circle owners cannot leave; archive the circle instead")
    member = db.scalar(
        select(PledgeCircleMember).where(
            PledgeCircleMember.circle_id == circle_id,
            PledgeCircleMember.user_id == user.id,
        )
    )
    if not member:
        raise HTTPException(404, "You are not a member of this circle")
    db.delete(member)
    db.commit()


def _last_months(count: int = 3) -> list[str]:
    now = datetime.now(timezone.utc)
    months: list[str] = []
    year, month = now.year, now.month
    for _ in range(count):
        months.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return months


def circle_stats(db: Session, circle: PledgeCircle) -> dict:
    member_ids = list(
        db.scalars(
            select(PledgeCircleMember.user_id).where(PledgeCircleMember.circle_id == circle.id)
        ).all()
    )
    member_count = len(member_ids)
    if not member_ids:
        return {
            "member_count": 0,
            "active_members": 0,
            "participation_rate": 0.0,
            "confirmed_actions_this_month": 0,
            "consistency_score": 0.0,
        }
    month = _current_month()
    active_members = int(
        db.scalar(
            select(func.count(distinct(Contribution.user_id))).where(
                Contribution.user_id.in_(member_ids),
                Contribution.status == ContributionStatus.confirmed,
                Contribution.contribution_month == month,
            )
        )
        or 0
    )
    confirmed_actions = int(
        db.scalar(
            select(func.count(Contribution.id)).where(
                Contribution.user_id.in_(member_ids),
                Contribution.status == ContributionStatus.confirmed,
                Contribution.contribution_month == month,
            )
        )
        or 0
    )
    recent_months = _last_months(3)
    active_pairs = int(
        db.scalar(
            select(func.count()).select_from(
                select(Contribution.user_id, Contribution.contribution_month)
                .where(
                    Contribution.user_id.in_(member_ids),
                    Contribution.status == ContributionStatus.confirmed,
                    Contribution.contribution_month.in_(recent_months),
                )
                .distinct()
                .subquery()
            )
        )
        or 0
    )
    denominator = member_count * len(recent_months)
    return {
        "member_count": member_count,
        "active_members": active_members,
        "participation_rate": round((active_members / member_count) * 100, 1),
        "confirmed_actions_this_month": confirmed_actions,
        "consistency_score": round((active_pairs / denominator) * 100, 1) if denominator else 0.0,
    }


def circle_out(db: Session, user: User, circle: PledgeCircle, include_members: bool = False) -> dict:
    base = settings.WEB_APP_BASE_URL.rstrip("/")
    result = {
        "id": circle.id,
        "name": circle.name,
        "description": circle.description,
        "invite_code": circle.invite_code,
        "owner_user_id": circle.owner_user_id,
        "is_owner": circle.owner_user_id == user.id,
        "share_url": f"{base}/join-circle?code={circle.invite_code}",
        "stats": circle_stats(db, circle),
    }
    if include_members:
        rows = db.execute(
            select(PledgeCircleMember, User)
            .join(User, User.id == PledgeCircleMember.user_id)
            .where(PledgeCircleMember.circle_id == circle.id)
            .order_by(PledgeCircleMember.joined_at.asc())
        ).all()
        result["members"] = [
            {
                "user_id": member.user_id,
                "display_name": get_display_name(member_user),
                "role": member.role,
                "joined_at": member.joined_at,
            }
            for member, member_user in rows
        ]
    return result


def list_circles(db: Session, user: User) -> list[dict]:
    circles = list(
        db.scalars(
            select(PledgeCircle)
            .join(PledgeCircleMember, PledgeCircleMember.circle_id == PledgeCircle.id)
            .where(
                PledgeCircleMember.user_id == user.id,
                PledgeCircle.is_active.is_(True),
            )
            .order_by(PledgeCircle.created_at.desc())
        ).all()
    )
    return [circle_out(db, user, circle) for circle in circles]


def get_circle(db: Session, user: User, circle_id: UUID) -> dict:
    membership = db.scalar(
        select(PledgeCircleMember).where(
            PledgeCircleMember.circle_id == circle_id,
            PledgeCircleMember.user_id == user.id,
        )
    )
    if not membership:
        raise HTTPException(403, "Join this Pledge Circle to view its members")
    circle = db.get(PledgeCircle, circle_id)
    if not circle or not circle.is_active:
        raise HTTPException(404, "Pledge Circle not found")
    return circle_out(db, user, circle, include_members=True)


def create_feature_request(db: Session, user: User, data: FeatureRequestCreate) -> FeatureRequest:
    request = FeatureRequest(
        user_id=user.id,
        title=data.title.strip(),
        description=data.description.strip(),
        status="new",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request
