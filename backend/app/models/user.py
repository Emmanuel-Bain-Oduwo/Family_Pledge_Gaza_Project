import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Enum, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, SoftDeleteMixin, TimestampMixin
from .enums import UserRole

if TYPE_CHECKING:
    from .pledge import Pledge
    from .contribution import Contribution
    from .collector import Collector, CollectorMember
    from .badge import UserBadge
    from .ai_draft import AiDraft
    from .audit import AdminAuditLog
    from .notification import Notification
    from .reminder import DailyReminder
    from .campaign import Campaign
    from .namlef import NamlefContent
    from .impact import ImpactCard
    from .project import Project


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    nickname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, unique=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.donor
    )
    anonymous_publicly: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    # Shown publicly when anonymous_publicly is True
    public_display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    collector_code: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, unique=True
    )
    push_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    pledges: Mapped[List["Pledge"]] = relationship(
        "Pledge", back_populates="user", foreign_keys="Pledge.user_id"
    )
    contributions: Mapped[List["Contribution"]] = relationship(
        "Contribution", back_populates="user", foreign_keys="Contribution.user_id"
    )
    confirmed_contributions: Mapped[List["Contribution"]] = relationship(
        "Contribution", back_populates="confirmed_by_user", foreign_keys="Contribution.confirmed_by"
    )
    collector_profile: Mapped[Optional["Collector"]] = relationship(
        "Collector", back_populates="user", uselist=False
    )
    collector_memberships: Mapped[List["CollectorMember"]] = relationship(
        "CollectorMember", back_populates="donor_user"
    )
    badges: Mapped[List["UserBadge"]] = relationship("UserBadge", back_populates="user")
    ai_drafts: Mapped[List["AiDraft"]] = relationship(
        "AiDraft", back_populates="admin", foreign_keys="AiDraft.admin_id"
    )
    approved_ai_drafts: Mapped[List["AiDraft"]] = relationship(
        "AiDraft", back_populates="approved_by_user", foreign_keys="AiDraft.approved_by"
    )
    audit_logs: Mapped[List["AdminAuditLog"]] = relationship(
        "AdminAuditLog", back_populates="admin"
    )
    sent_notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="sent_by_user"
    )
    created_reminders: Mapped[List["DailyReminder"]] = relationship(
        "DailyReminder", back_populates="created_by_user", foreign_keys="DailyReminder.created_by"
    )
    approved_reminders: Mapped[List["DailyReminder"]] = relationship(
        "DailyReminder", back_populates="approved_by_user", foreign_keys="DailyReminder.approved_by"
    )
    created_campaigns: Mapped[List["Campaign"]] = relationship(
        "Campaign", back_populates="created_by_user"
    )
    created_projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="created_by_user"
    )
    created_namlef_content: Mapped[List["NamlefContent"]] = relationship(
        "NamlefContent", back_populates="created_by_user"
    )
    created_impact_cards: Mapped[List["ImpactCard"]] = relationship(
        "ImpactCard", back_populates="created_by_user"
    )

    __table_args__ = (
        Index("ix_users_role", "role"),
        Index("ix_users_country", "country"),
        Index("ix_users_is_active", "is_active"),
        Index("ix_users_deleted_at", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} role={self.role}>"
