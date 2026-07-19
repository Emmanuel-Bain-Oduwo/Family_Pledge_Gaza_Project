import uuid
from sqlalchemy.orm import Session

from app.models.audit import AdminAuditLog
from app.models.contribution import Contribution
from app.models.enums import ContributionStatus


def _log_contribution_status_change(
    db: Session,
    admin_id: uuid.UUID,
    contribution: Contribution,
    old_status: ContributionStatus,
    new_status: ContributionStatus,
    action_suffix: str,
) -> None:
    """Create an admin audit log entry for a contribution status change."""
    log = AdminAuditLog(
        admin_id=admin_id,
        action=f"contribution.{action_suffix}",
        entity_type="contribution",
        entity_id=str(contribution.id),
        metadata_={"old_status": old_status.value, "new_status": new_status.value},
    )
    db.add(log)


def confirm_contribution(
    db: Session,
    contribution_id: uuid.UUID,
    admin_id: uuid.UUID,
) -> Contribution:
    contribution = db.get(Contribution, contribution_id)
    if not contribution:
        raise ValueError("Contribution not found")
    old_status = contribution.status
    contribution.status = ContributionStatus.confirmed
    _log_contribution_status_change(
        db, admin_id, contribution, old_status, ContributionStatus.confirmed, "confirm"
    )
    db.flush()
    return contribution


def reject_contribution(
    db: Session,
    contribution_id: uuid.UUID,
    admin_id: uuid.UUID,
) -> Contribution:
    contribution = db.get(Contribution, contribution_id)
    if not contribution:
        raise ValueError("Contribution not found")
    old_status = contribution.status
    contribution.status = ContributionStatus.rejected
    _log_contribution_status_change(
        db, admin_id, contribution, old_status, ContributionStatus.rejected, "reject"
    )
    db.flush()
    return contribution


def mark_for_follow_up(
    db: Session,
    contribution_id: uuid.UUID,
    admin_id: uuid.UUID,
) -> Contribution:
    contribution = db.get(Contribution, contribution_id)
    if not contribution:
        raise ValueError("Contribution not found")
    old_status = contribution.status
    contribution.status = ContributionStatus.follow_up
    _log_contribution_status_change(
        db, admin_id, contribution, old_status, ContributionStatus.follow_up, "follow_up"
    )
    db.flush()
    return contribution
