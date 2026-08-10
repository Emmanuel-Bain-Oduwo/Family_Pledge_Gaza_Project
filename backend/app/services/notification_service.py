import base64
import json
import logging
from datetime import datetime, timezone
from typing import List, Tuple

import httpx
from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit import AdminAuditLog
from app.models.contribution import Contribution
from app.models.enums import ContributionStatus, NotificationAudience, NotificationType, UserRole
from app.models.notification import Notification
from app.models.notification_endpoint import NotificationEndpoint
from app.models.user import User
from app.schemas.notification import NotificationSend

log = logging.getLogger(__name__)


def _audience_query(audience: NotificationAudience):
    query = select(User).where(User.deleted_at.is_(None), User.is_active.is_(True))
    if audience == NotificationAudience.admins:
        return query.where(User.role.in_([UserRole.admin, UserRole.super_admin]))
    if audience == NotificationAudience.collectors:
        return query.where(User.role == UserRole.collector)
    if audience == NotificationAudience.confirmed_donors:
        return query.join(Contribution, Contribution.user_id == User.id).where(
            Contribution.status == ContributionStatus.confirmed
        ).distinct()
    if audience == NotificationAudience.pending_donors:
        confirmed_users = select(Contribution.user_id).where(Contribution.status == ContributionStatus.confirmed)
        return query.where(User.role == UserRole.donor, User.id.not_in(confirmed_users))
    return query


def _preference(user: User, name: str, default: bool = False) -> bool:
    """Read a notification preference safely across older user/test objects."""
    return bool(getattr(user, name, default))


def _push_preference_allows(user: User, notification_type: NotificationType, category: str | None = None) -> bool:
    category_map = {
        "quran": _preference(user, "notification_quran"),
        "hadith": _preference(user, "notification_hadith"),
        "dua": _preference(user, "notification_dua"),
        "motivation": _preference(user, "notification_motivation"),
        "impact": _preference(user, "notification_impact") or _preference(user, "notification_campaigns"),
        "humanitarian": _preference(user, "notification_humanitarian"),
        "campaign": _preference(user, "notification_campaigns"),
        "emergency": _preference(user, "notification_emergency"),
        "pledge": _preference(user, "notification_daily"),
    }
    if category in category_map:
        return category_map[category]
    if notification_type == NotificationType.emergency:
        return _preference(user, "notification_emergency")
    if notification_type == NotificationType.impact:
        return _preference(user, "notification_impact") or _preference(user, "notification_campaigns")
    if notification_type == NotificationType.campaign:
        return _preference(user, "notification_campaigns")
    if notification_type in (NotificationType.reminder, NotificationType.pledge):
        return _preference(user, "notification_daily")
    return True


def _send_expo_push(tokens: List[str], title: str, body: str, notification_type: str = "general", category: str | None = None) -> tuple[int, int]:
    if not tokens:
        return 0, 0
    channel_id = "emergency" if notification_type == "emergency" else ("reminders" if notification_type == "reminder" else "default")
    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
            "channelId": channel_id,
            "data": {
                "screen": "/screens/notifications",
                "notification_type": notification_type,
                "content_category": category or "general",
            },
        }
        for token in tokens
    ]
    headers = {"Content-Type": "application/json"}
    if settings.EXPO_ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {settings.EXPO_ACCESS_TOKEN}"
    sent = 0
    failed = 0
    with httpx.Client(timeout=20) as client:
        for index in range(0, len(messages), 100):
            batch = messages[index:index + 100]
            try:
                response = client.post("https://exp.host/--/api/v2/push/send", json=batch, headers=headers)
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError):
                failed += len(batch)
                continue
            receipts = payload.get("data", []) if isinstance(payload, dict) else []
            batch_success = sum(1 for receipt in receipts if isinstance(receipt, dict) and receipt.get("status") == "ok")
            sent += batch_success
            failed += len(batch) - batch_success
    return sent, failed


def _firebase_app():
    if not settings.FIREBASE_SERVICE_ACCOUNT_JSON_B64:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError:
        log.error("firebase-admin package is not installed")
        return None
    app_name = "family-pledge-notifications"
    try:
        return firebase_admin.get_app(app_name)
    except ValueError:
        try:
            raw = base64.b64decode(settings.FIREBASE_SERVICE_ACCOUNT_JSON_B64).decode("utf-8")
            info = json.loads(raw)
            options = {}
            project_id = settings.FIREBASE_PROJECT_ID or info.get("project_id")
            if project_id:
                options["projectId"] = project_id
            return firebase_admin.initialize_app(credentials.Certificate(info), options=options or None, name=app_name)
        except Exception as exc:
            log.error("Firebase notification credentials could not be initialized: %s", exc)
            return None


def _send_fcm_web(tokens: List[str], title: str, body: str, notification_type: str = "general", category: str | None = None) -> tuple[int, int]:
    if not tokens:
        return 0, 0
    app = _firebase_app()
    if app is None:
        return 0, len(tokens)
    try:
        from firebase_admin import messaging
    except ImportError:
        return 0, len(tokens)
    link = f"{settings.WEB_APP_BASE_URL.rstrip('/')}/screens/notifications"
    sent = 0
    failed = 0
    for index in range(0, len(tokens), 500):
        batch = tokens[index:index + 500]
        message = messaging.MulticastMessage(
            tokens=batch,
            notification=messaging.Notification(title=title, body=body),
            data={
                "screen": "/screens/notifications",
                "notification_type": notification_type,
                "content_category": category or "general",
            },
            webpush=messaging.WebpushConfig(fcm_options=messaging.WebpushFCMOptions(link=link)),
        )
        try:
            response = messaging.send_each_for_multicast(message, app=app)
            sent += int(response.success_count)
            failed += int(response.failure_count)
        except Exception as exc:
            log.warning("Firebase Web push batch failed: %s", exc)
            failed += len(batch)
    return sent, failed


def _resolve_delivery_tokens(db: Session, users: list[User]) -> tuple[list[str], list[str]]:
    if not users:
        return [], []
    user_ids = [user.id for user in users]
    endpoints = list(db.scalars(select(NotificationEndpoint).where(
        NotificationEndpoint.user_id.in_(user_ids),
        NotificationEndpoint.is_active.is_(True),
    )).all())
    expo_tokens = {endpoint.token for endpoint in endpoints if endpoint.provider == "expo"}
    web_tokens = {endpoint.token for endpoint in endpoints if endpoint.provider == "fcm_web" and endpoint.platform == "web"}
    expo_tokens.update(user.push_token for user in users if user.push_token)
    return sorted(expo_tokens), sorted(web_tokens)


def _eligible_users(db: Session, data: NotificationSend) -> list[User]:
    users = list(db.scalars(_audience_query(data.audience)).unique().all())
    return [
        user for user in users
        if _push_preference_allows(user, data.notification_type, data.content_category)
    ]


def send(db: Session, admin: User, data: NotificationSend) -> Notification:
    eligible_users = _eligible_users(db, data)
    expo_tokens, web_tokens = _resolve_delivery_tokens(db, eligible_users)
    expo_sent, expo_failed = _send_expo_push(
        expo_tokens, data.title, data.body, data.notification_type.value, data.content_category
    )
    web_sent, web_failed = _send_fcm_web(
        web_tokens, data.title, data.body, data.notification_type.value, data.content_category
    )
    sent_count = expo_sent + web_sent
    failure_count = expo_failed + web_failed

    notification = Notification(
        title=data.title,
        body=data.body,
        notification_type=data.notification_type,
        content_category=data.content_category,
        audience=data.audience,
        sent_count=sent_count,
        failure_count=failure_count,
        sent_by=admin.id,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    db.flush()
    db.add(AdminAuditLog(
        admin_id=admin.id,
        action="notification.send",
        entity_type="notification",
        entity_id=str(notification.id),
        metadata_={
            "audience": data.audience.value,
            "content_category": data.content_category,
            "eligible_users": len(eligible_users),
            "expo_endpoints": len(expo_tokens),
            "web_endpoints": len(web_tokens),
            "sent_count": sent_count,
            "failure_count": failure_count,
        },
    ))
    db.commit()
    db.refresh(notification)
    return notification


def list_notifications(db: Session, skip: int = 0, limit: int = 20) -> Tuple[List[Notification], int]:
    base = select(Notification)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.order_by(Notification.created_at.desc()).offset(skip).limit(limit)).all())
    return items, total
