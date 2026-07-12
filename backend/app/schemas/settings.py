from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AppSettingsBase(BaseModel):
    payment_link: str = "https://familypledge.org/contribute"
    payment_instructions: str = "Use the official Family Pledge payment link or DIB Bank/M-PESA details, then submit your transaction reference in the app."
    org_contact_email: str = "support@familypledge.org"
    org_contact_phone: str = "+254700000000"
    app_notice: str = ""
    privacy_policy_url: str = "https://familypledge.org/privacy"
    terms_url: str = "https://familypledge.org/terms"
    payment_account_name: str = "NAMLEF GAZA FAMILY SUPPORT"
    payment_account_number: str = "001505100664103"
    payment_currency: str = "KES"
    payment_bank_name: str = "DIB Bank Kenya Limited"
    payment_branch_name: str = "Upper Hill Branch"
    payment_swift_code: str = "DUIBKENA"
    payment_intermediary_bank: str = "J.P. Morgan Chase Bank, NY"
    payment_intermediary_swift_code: str = "CHASUS33"
    payment_mpesa_paybill: str = "342342"
    payment_bank_code: str = "75"
    payment_branch_code: str = "001"


class AppSettingsUpdate(BaseModel):
    payment_link: Optional[str] = None
    payment_instructions: Optional[str] = None
    org_contact_email: Optional[str] = None
    org_contact_phone: Optional[str] = None
    app_notice: Optional[str] = None
    privacy_policy_url: Optional[str] = None
    terms_url: Optional[str] = None
    payment_account_name: Optional[str] = None
    payment_account_number: Optional[str] = None
    payment_currency: Optional[str] = None
    payment_bank_name: Optional[str] = None
    payment_branch_name: Optional[str] = None
    payment_swift_code: Optional[str] = None
    payment_intermediary_bank: Optional[str] = None
    payment_intermediary_swift_code: Optional[str] = None
    payment_mpesa_paybill: Optional[str] = None
    payment_bank_code: Optional[str] = None
    payment_branch_code: Optional[str] = None


class AppSettingsOut(AppSettingsBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
