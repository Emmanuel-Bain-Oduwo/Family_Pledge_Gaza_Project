from typing import List, Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.impact import ImpactCard
from app.models.user import User
from app.schemas.impact_card import ImpactCardCreate, ImpactCardUpdate


def list_cards(db: Session, skip: int = 0, limit: int = 20) -> Tuple[List[ImpactCard], int]:
    base = select(ImpactCard)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(
        db.scalars(base.order_by(ImpactCard.created_at.desc()).offset(skip).limit(limit)).all()
    )
    return items, total


def get_by_id(db: Session, card_id: UUID) -> ImpactCard:
    card = db.scalar(select(ImpactCard).where(ImpactCard.id == card_id))
    if not card:
        raise HTTPException(404, "Impact card not found")
    return card


def create(db: Session, admin: User, data: ImpactCardCreate) -> ImpactCard:
    card = ImpactCard(
        project_id=data.project_id,
        title=data.title,
        story=data.story,
        beneficiaries_count=data.beneficiaries_count,
        image_url=data.image_url,
        video_url=data.video_url,
        completed_at=data.completed_at,
        created_by=admin.id,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def update(db: Session, admin: User, card_id: UUID, data: ImpactCardUpdate) -> ImpactCard:
    card = get_by_id(db, card_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


def delete(db: Session, admin: User, card_id: UUID) -> None:
    card = get_by_id(db, card_id)
    db.delete(card)
    db.commit()
