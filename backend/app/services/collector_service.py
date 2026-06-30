import secrets
import string
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.collector import Collector, CollectorMember
from app.models.contribution import Contribution
from app.models.enums import ContributionStatus, UserRole
from app.models.user import User
from app.schemas.collector import CollectorCreate, CollectorMemberAdd
from app.services.user_service import get_display_name
from app.utils.validators import current_month


def _generate_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _get_collector_for_user(db: Session, user: User) -> Collector:
    collector = db.scalar(
        select(Collector).where(Collector.user_id == user.id)
    )
    if not collector:
        raise HTTPException(404, "Collector profile not found for this user")
    return collector


def get_dashboard(db: Session, user: User) -> dict:
    collector = _get_collector_for_user(db, user)

    member_count = db.scalar(
        select(func.count(CollectorMember.id)).where(
            CollectorMember.collector_id == collector.id
        )
    ) or 0

    member_user_ids = [
        row[0]
        for row in db.execute(
            select(CollectorMember.donor_user_id).where(
                CollectorMember.collector_id == collector.id
            )
        ).all()
    ]

    month = current_month()

    confirmed_this_month = 0
    pending_this_month = 0
    total_confirmed = 0

    if member_user_ids:
        confirmed_this_month = db.scalar(
            select(func.count(Contribution.id)).where(
                Contribution.user_id.in_(member_user_ids),
                Contribution.contribution_month == month,
                Contribution.status == ContributionStatus.confirmed,
            )
        ) or 0

        pending_this_month = db.scalar(
            select(func.count(Contribution.id)).where(
                Contribution.user_id.in_(member_user_ids),
                Contribution.contribution_month == month,
                Contribution.status == ContributionStatus.submitted,
            )
        ) or 0

        total_confirmed = db.scalar(
            select(func.count(Contribution.id)).where(
                Contribution.user_id.in_(member_user_ids),
                Contribution.status == ContributionStatus.confirmed,
            )
        ) or 0

    return {
        "collector": collector,
        "member_count": member_count,
        "confirmed_this_month": confirmed_this_month,
        "pending_this_month": pending_this_month,
        "total_confirmed": total_confirmed,
    }


def get_members(db: Session, user: User) -> List[dict]:
    collector = _get_collector_for_user(db, user)

    rows = db.execute(
        select(CollectorMember, User)
        .join(User, CollectorMember.donor_user_id == User.id)
        .where(CollectorMember.collector_id == collector.id)
        .order_by(CollectorMember.created_at.desc())
    ).all()

    return [
        {
            "id": cm.id,
            "collector_id": cm.collector_id,
            "donor_user_id": cm.donor_user_id,
            "display_name": get_display_name(donor),
            "country": donor.country,
            "joined_at": cm.created_at,
        }
        for cm, donor in rows
    ]


def generate_invite_code(db: Session, user: User) -> str:
    collector = _get_collector_for_user(db, user)
    return collector.collector_code


def admin_list(db: Session, skip: int = 0, limit: int = 20) -> Tuple[List[Collector], int]:
    base = select(Collector)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(base.order_by(Collector.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def admin_create(db: Session, admin: User, data: CollectorCreate) -> Collector:
    target_user = db.scalar(select(User).where(User.id == data.user_id))
    if not target_user:
        raise HTTPException(404, "User not found")

    existing = db.scalar(select(Collector).where(Collector.user_id == data.user_id))
    if existing:
        raise HTTPException(400, "User already has a collector profile")

    # Ensure unique collector code
    code = _generate_code()
    while db.scalar(select(Collector).where(Collector.collector_code == code)):
        code = _generate_code()

    collector = Collector(
        user_id=data.user_id,
        collector_code=code,
        group_name=data.group_name,
        country=data.country or target_user.country,
    )

    # Promote user to collector role
    target_user.role = UserRole.collector
    target_user.collector_code = code

    db.add(collector)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="collector.create",
            entity_type="collector",
            entity_id=str(data.user_id),
            metadata_={"code": code},
        )
    )
    db.commit()
    db.refresh(collector)
    return collector


def admin_add_member(
    db: Session, admin: User, collector_id: UUID, data: CollectorMemberAdd
) -> CollectorMember:
    collector = db.scalar(select(Collector).where(Collector.id == collector_id))
    if not collector:
        raise HTTPException(404, "Collector not found")

    donor = db.scalar(select(User).where(User.id == data.donor_user_id))
    if not donor:
        raise HTTPException(404, "Donor user not found")

    existing = db.scalar(
        select(CollectorMember).where(
            CollectorMember.collector_id == collector_id,
            CollectorMember.donor_user_id == data.donor_user_id,
        )
    )
    if existing:
        raise HTTPException(400, "User is already a member of this collector circle")

    member = CollectorMember(
        collector_id=collector_id,
        donor_user_id=data.donor_user_id,
    )
    db.add(member)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="collector.add_member",
            entity_type="collector",
            entity_id=str(collector_id),
            metadata_={"donor_user_id": str(data.donor_user_id)},
        )
    )
    db.commit()
    db.refresh(member)
    return member


def admin_remove_member(
    db: Session, admin: User, collector_id: UUID, donor_user_id: UUID
) -> None:
    member = db.scalar(
        select(CollectorMember).where(
            CollectorMember.collector_id == collector_id,
            CollectorMember.donor_user_id == donor_user_id,
        )
    )
    if not member:
        raise HTTPException(404, "Member not found in this collector circle")

    db.delete(member)
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="collector.remove_member",
            entity_type="collector",
            entity_id=str(collector_id),
            metadata_={"donor_user_id": str(donor_user_id)},
        )
    )
    db.commit()
