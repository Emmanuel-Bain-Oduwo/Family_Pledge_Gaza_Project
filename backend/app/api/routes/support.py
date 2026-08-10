from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.support_message import SupportMessage
from app.models.user import User
from app.schemas.support import SupportMessageAdminUpdate, SupportMessageCreate, SupportMessageOut

router = APIRouter(tags=["Support"])


def _serialize(message: SupportMessage, user: User | None = None) -> SupportMessageOut:
    return SupportMessageOut(
        id=message.id,
        user_id=message.user_id,
        subject=message.subject,
        message=message.message,
        category=message.category,
        status=message.status,
        admin_response=message.admin_response,
        responded_by=message.responded_by,
        responded_at=message.responded_at,
        created_at=message.created_at,
        updated_at=message.updated_at,
        user_display_name=(user.full_name or user.nickname) if user else None,
        user_email=user.email if user else None,
        user_phone=user.phone if user else None,
    )


@router.post("/support/messages", response_model=SupportMessageOut, status_code=201)
def create_support_message(
    data: SupportMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = SupportMessage(
        user_id=current_user.id,
        subject=data.subject.strip(),
        message=data.message.strip(),
        category=data.category,
        status="open",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item, current_user)


@router.get("/support/messages/me", response_model=list[SupportMessageOut])
def my_support_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = list(db.scalars(
        select(SupportMessage)
        .where(SupportMessage.user_id == current_user.id)
        .order_by(SupportMessage.created_at.desc())
        .limit(50)
    ).all())
    return [_serialize(item, current_user) for item in items]


@router.get("/admin/support/messages", response_model=list[SupportMessageOut])
def admin_support_messages(
    status: str | None = Query(None),
    limit: int = Query(100, ge=1, le=200),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(SupportMessage).order_by(SupportMessage.created_at.desc()).limit(limit)
    if status:
        query = query.where(SupportMessage.status == status)
    items = list(db.scalars(query).all())
    users = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_([item.user_id for item in items]))).all()
    } if items else {}
    return [_serialize(item, users.get(item.user_id)) for item in items]


@router.patch("/admin/support/messages/{message_id}", response_model=SupportMessageOut)
def update_support_message(
    message_id: UUID,
    data: SupportMessageAdminUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = db.get(SupportMessage, message_id)
    if not item:
        raise HTTPException(404, "Support message not found")
    if data.status is not None:
        item.status = data.status
    if data.admin_response is not None:
        item.admin_response = data.admin_response.strip() or None
        item.responded_by = admin.id if item.admin_response else None
        item.responded_at = datetime.now(timezone.utc) if item.admin_response else None
        if item.admin_response and item.status == "open":
            item.status = "in_progress"
    db.add(item)
    db.commit()
    db.refresh(item)
    user = db.get(User, item.user_id)
    return _serialize(item, user)
