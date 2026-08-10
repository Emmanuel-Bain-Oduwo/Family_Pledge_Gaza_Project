from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.admin_operations import (
    CommandCenterOut,
    CommunicationPreviewOut,
    DonorAdminProfileUpdate,
    DonorDetailOut,
    DonorOperationsPage,
    FollowupStateUpdate,
    OutboundCampaignCreate,
    OutboundCampaignOut,
)
from app.services import admin_operations_service

router = APIRouter(prefix="/admin/operations", tags=["Admin Operations"])


@router.get("/command-center", response_model=CommandCenterOut)
def command_center(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_operations_service.command_center(db)


@router.get("/donors", response_model=DonorOperationsPage)
def operations_donors(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=10, le=100),
    search: str | None = Query(None),
    country: str | None = Query(None),
    segment: str = Query("all_donors"),
    priority: str | None = Query(None),
    followup_status: str | None = Query(None),
    assigned_admin_id: UUID | None = Query(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_operations_service.list_donors(
        db,
        page=page,
        size=size,
        search=search,
        country=country,
        segment=segment,
        priority=priority,
        followup_status=followup_status,
        assigned_admin_id=assigned_admin_id,
    )


@router.get("/donors/{donor_id}", response_model=DonorDetailOut)
def donor_detail(
    donor_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_operations_service.donor_detail(db, donor_id)


@router.patch("/donors/{donor_id}/profile")
def update_donor_profile(
    donor_id: UUID,
    data: DonorAdminProfileUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profile = admin_operations_service.update_donor_profile(db, donor_id, data, admin)
    return {
        "user_id": str(profile.user_id),
        "assigned_admin_id": str(profile.assigned_admin_id) if profile.assigned_admin_id else None,
        "priority": profile.priority,
        "followup_status": profile.followup_status,
        "tags": profile.tags or [],
        "internal_notes": profile.internal_notes,
        "next_followup_at": profile.next_followup_at,
        "last_contacted_at": profile.last_contacted_at,
    }


@router.post("/followups/sync")
def sync_followups(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    created = admin_operations_service.sync_followups(db)
    return {"created": created}


@router.get("/followups")
def list_followups(
    assigned_admin_id: UUID | None = Query(None),
    priority: str | None = Query(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_operations_service.list_followups(
        db, assigned_admin_id=assigned_admin_id, priority=priority
    )


@router.patch("/followups/{followup_id}")
def update_followup(
    followup_id: UUID,
    data: FollowupStateUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = admin_operations_service.update_followup_state(db, followup_id, data, admin)
    return {
        "id": str(item.id),
        "status": item.status.value,
        "assigned_admin_id": str(item.assigned_admin_id) if item.assigned_admin_id else None,
        "snoozed_until": item.snoozed_until,
        "resolved_at": item.resolved_at,
        "last_contacted_at": item.last_contacted_at,
        "contact_channel": item.contact_channel,
    }


@router.get("/communications/preview", response_model=CommunicationPreviewOut)
def communication_preview(
    segment: str = Query("all_donors"),
    content_category: str | None = Query("pledge"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_operations_service.communication_preview(db, segment, content_category)


@router.post("/communications", response_model=OutboundCampaignOut, status_code=201)
def queue_communication(
    data: OutboundCampaignCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_operations_service.queue_communication(db, admin, data)


@router.get("/communications", response_model=list[OutboundCampaignOut])
def communications(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_operations_service.list_communications(db)


@router.post("/communications/{campaign_id}/run", response_model=OutboundCampaignOut)
def run_communication_batch(
    campaign_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.models.admin_operations import OutboundCampaign

    campaign = db.get(OutboundCampaign, campaign_id)
    if not campaign:
        from fastapi import HTTPException
        raise HTTPException(404, "Communication campaign not found")
    admin_operations_service.process_campaign_batch(db, campaign)
    db.refresh(campaign)
    return campaign


@router.get("/donors-export.csv")
def export_donors(
    segment: str = Query("all_donors"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    content = admin_operations_service.export_donors_csv(db, segment)
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="family-pledge-{segment}.csv"'},
    )
