import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class AppSettings(Base, TimestampMixin):
    __tablename__ = "app_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payment_link: Mapped[str] = mapped_column(String(1024), nullable=False, default="https://familypledge.org/contribute")
    payment_instructions: Mapped[str] = mapped_column(Text, nullable=False, default="Use the official Family Pledge payment link or DIB Bank/M-PESA details, then submit your transaction reference in the app.")
    org_contact_email: Mapped[str] = mapped_column(String(255), nullable=False, default="support@familypledge.org")
    org_contact_phone: Mapped[str] = mapped_column(String(50), nullable=False, default="+254700000000")
    app_notice: Mapped[str] = mapped_column(Text, nullable=False, default="")
    privacy_policy_url: Mapped[str] = mapped_column(String(1024), nullable=False, default="https://familypledge.org/privacy")
    terms_url: Mapped[str] = mapped_column(String(1024), nullable=False, default="https://familypledge.org/terms")
    payment_account_name: Mapped[str] = mapped_column(String(255), nullable=False, default="NAMLEF GAZA FAMILY SUPPORT")
    payment_account_number: Mapped[str] = mapped_column(String(50), nullable=False, default="001505100664103")
    payment_currency: Mapped[str] = mapped_column(String(10), nullable=False, default="KES")
    payment_bank_name: Mapped[str] = mapped_column(String(255), nullable=False, default="DIB Bank Kenya Limited")
    payment_branch_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Upper Hill Branch")
    payment_swift_code: Mapped[str] = mapped_column(String(50), nullable=False, default="DUIBKENA")
    payment_intermediary_bank: Mapped[str] = mapped_column(String(255), nullable=False, default="J.P. Morgan Chase Bank, NY")
    payment_intermediary_swift_code: Mapped[str] = mapped_column(String(50), nullable=False, default="CHASUS33")
    payment_mpesa_paybill: Mapped[str] = mapped_column(String(50), nullable=False, default="342342")
    payment_bank_code: Mapped[str] = mapped_column(String(20), nullable=False, default="75")
    payment_branch_code: Mapped[str] = mapped_column(String(20), nullable=False, default="001")
