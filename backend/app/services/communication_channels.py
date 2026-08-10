import logging
import re
import smtplib
from email.message import EmailMessage

import httpx

from app.core.config import settings
from app.models.user import User

log = logging.getLogger(__name__)


def send_email_reminder(user: User, title: str, body: str) -> tuple[bool, str | None]:
    if not user.email or not user.email_reminders_opt_in:
        return False, "Email reminder consent or email address is missing"
    if not all([settings.SMTP_HOST, settings.EMAIL_FROM]):
        return False, "SMTP reminder delivery is not configured"

    unsubscribe_url = (
        f"{settings.WEB_APP_BASE_URL.rstrip('/')}/api/v1/users/unsubscribe-weekly-email/"
        f"{user.email_unsubscribe_token}"
    )
    message = EmailMessage()
    message["Subject"] = title
    message["From"] = settings.EMAIL_FROM
    message["To"] = user.email
    message.set_content(
        f"{body}\n\n"
        "You are receiving this because you opted in to Family Pledge email reminders.\n"
        f"Manage your reminder preferences in the Family Pledge app.\n"
        f"Unsubscribe from weekly email: {unsubscribe_url}"
    )
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as client:
            if settings.SMTP_USE_TLS:
                client.starttls()
            if settings.SMTP_USER:
                client.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            client.send_message(message)
        return True, None
    except Exception as exc:
        log.warning("Email reminder failed for user %s: %s", user.id, exc)
        return False, "Email provider delivery failed"


def _whatsapp_number(phone: str) -> str:
    return re.sub(r"[^0-9]", "", phone)


def send_whatsapp_reminder(user: User, title: str, body: str) -> tuple[bool, str | None]:
    if not user.phone or not user.whatsapp_reminders_opt_in:
        return False, "WhatsApp reminder consent or phone number is missing"
    required = [
        settings.WHATSAPP_GRAPH_API_VERSION,
        settings.WHATSAPP_PHONE_NUMBER_ID,
        settings.WHATSAPP_ACCESS_TOKEN,
        settings.WHATSAPP_TEMPLATE_NAME,
    ]
    if not settings.WHATSAPP_ENABLED or not all(required):
        return False, "WhatsApp Business delivery is not configured"

    to = _whatsapp_number(user.phone)
    if not to:
        return False, "Phone number is not usable for WhatsApp delivery"
    url = (
        f"{settings.WHATSAPP_GRAPH_BASE_URL.rstrip('/')}/"
        f"{settings.WHATSAPP_GRAPH_API_VERSION.strip('/')}/"
        f"{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": settings.WHATSAPP_TEMPLATE_NAME,
            "language": {"code": settings.WHATSAPP_TEMPLATE_LANGUAGE},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": title[:200]},
                        {"type": "text", "text": body[:900]},
                    ],
                }
            ],
        },
    }
    try:
        response = httpx.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )
        response.raise_for_status()
        return True, None
    except httpx.HTTPError as exc:
        log.warning("WhatsApp reminder failed for user %s: %s", user.id, exc)
        return False, "WhatsApp provider delivery failed"
