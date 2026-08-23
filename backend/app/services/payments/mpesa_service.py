import base64
from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings


class DarajaError(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        code: str | None = None,
        uncertain: bool = False,
    ):
        super().__init__(message)
        self.code = code
        self.uncertain = uncertain


def _require_configured() -> None:
    if not settings.MPESA_ENABLED:
        raise DarajaError("M-PESA payments are not enabled")
    if not all(
        (
            settings.MPESA_CONSUMER_KEY,
            settings.MPESA_CONSUMER_SECRET,
            settings.MPESA_SHORTCODE,
            settings.MPESA_PASSKEY,
            settings.MPESA_CALLBACK_URL,
            settings.MPESA_ACCOUNT_REFERENCE,
        )
    ):
        raise DarajaError("M-PESA configuration is incomplete")


def _timestamp() -> str:
    return datetime.now().strftime("%Y%m%d%H%M%S")


def _password(timestamp: str) -> str:
    raw = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    return base64.b64encode(raw.encode("utf-8")).decode("ascii")


def _basic_auth_header() -> str:
    raw = f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}"
    encoded = base64.b64encode(raw.encode("utf-8")).decode("ascii")
    return f"Basic {encoded}"


def get_access_token(client: httpx.Client | None = None) -> str:
    _require_configured()
    owns_client = client is None
    client = client or httpx.Client(timeout=settings.MPESA_REQUEST_TIMEOUT_SECONDS)
    try:
        response = client.get(
            f"{settings.mpesa_base_url}/oauth/v1/generate",
            params={"grant_type": "client_credentials"},
            headers={"Authorization": _basic_auth_header()},
        )
        response.raise_for_status()
        payload = response.json()
        token = payload.get("access_token")
        if not token:
            raise DarajaError("Daraja authorization did not return an access token")
        return str(token)
    except httpx.HTTPStatusError as exc:
        detail = _safe_error_detail(exc.response)
        raise DarajaError(f"Daraja authorization failed: {detail}") from exc
    except httpx.TimeoutException as exc:
        raise DarajaError("Daraja authorization timed out") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise DarajaError("Could not reach Daraja authorization service") from exc
    finally:
        if owns_client:
            client.close()


def initiate_stk_push(
    *,
    phone: str,
    amount_kes: int,
    account_reference: str | None = None,
    client: httpx.Client | None = None,
) -> dict[str, Any]:
    _require_configured()
    owns_client = client is None
    client = client or httpx.Client(timeout=settings.MPESA_REQUEST_TIMEOUT_SECONDS)
    reference = (account_reference or settings.MPESA_ACCOUNT_REFERENCE).strip()
    try:
        token = get_access_token(client)
        timestamp = _timestamp()
        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": _password(timestamp),
            "Timestamp": timestamp,
            "TransactionType": settings.MPESA_TRANSACTION_TYPE,
            "Amount": int(amount_kes),
            "PartyA": phone,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": reference[:12],
            "TransactionDesc": settings.MPESA_TRANSACTION_DESC[:20],
        }
        response = client.post(
            f"{settings.mpesa_base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        result = response.json()
        response_code = str(result.get("ResponseCode", ""))
        if response_code and response_code != "0":
            raise DarajaError(
                str(result.get("ResponseDescription") or "M-PESA rejected the STK request"),
                code=response_code,
            )
        return result
    except httpx.HTTPStatusError as exc:
        detail = _safe_error_detail(exc.response)
        raise DarajaError(f"Daraja STK request failed: {detail}") from exc
    except httpx.TimeoutException as exc:
        # Never mark this immediately failed: the provider may have accepted the
        # request even though our HTTP response was lost. Keeping it active blocks
        # an unsafe immediate retry until reconciliation/expiry resolves it.
        raise DarajaError(
            "Daraja STK request timed out; payment state is uncertain",
            uncertain=True,
        ) from exc
    except httpx.HTTPError as exc:
        raise DarajaError("Could not reach Daraja STK service") from exc
    except ValueError as exc:
        raise DarajaError("Daraja returned an invalid STK response") from exc
    finally:
        if owns_client:
            client.close()


def query_stk_status(
    checkout_request_id: str,
    *,
    client: httpx.Client | None = None,
) -> dict[str, Any]:
    _require_configured()
    owns_client = client is None
    client = client or httpx.Client(timeout=settings.MPESA_REQUEST_TIMEOUT_SECONDS)
    try:
        token = get_access_token(client)
        timestamp = _timestamp()
        response = client.post(
            f"{settings.mpesa_base_url}/mpesa/stkpushquery/v1/query",
            json={
                "BusinessShortCode": settings.MPESA_SHORTCODE,
                "Password": _password(timestamp),
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id,
            },
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        detail = _safe_error_detail(exc.response)
        raise DarajaError(f"Daraja transaction query failed: {detail}") from exc
    except httpx.TimeoutException as exc:
        raise DarajaError("Daraja transaction query timed out", uncertain=True) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise DarajaError("Could not query M-PESA transaction status") from exc
    finally:
        if owns_client:
            client.close()


def parse_stk_callback(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        callback = payload["Body"]["stkCallback"]
        result_code = str(callback["ResultCode"])
        result_desc = str(callback.get("ResultDesc") or "")
        checkout_request_id = str(callback["CheckoutRequestID"])
        merchant_request_id = str(callback.get("MerchantRequestID") or "") or None
    except (KeyError, TypeError, ValueError) as exc:
        raise DarajaError("Invalid M-PESA callback payload") from exc

    metadata: dict[str, Any] = {}
    items = ((callback.get("CallbackMetadata") or {}).get("Item") or [])
    if isinstance(items, list):
        for item in items:
            if isinstance(item, dict) and item.get("Name"):
                metadata[str(item["Name"])] = item.get("Value")

    return {
        "checkout_request_id": checkout_request_id,
        "merchant_request_id": merchant_request_id,
        "result_code": result_code,
        "result_description": result_desc,
        "amount": metadata.get("Amount"),
        "mpesa_receipt_number": metadata.get("MpesaReceiptNumber"),
        "transaction_date": metadata.get("TransactionDate"),
        "phone_number": metadata.get("PhoneNumber"),
    }


def _safe_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            for key in ("errorMessage", "error_description", "ResponseDescription", "message"):
                if payload.get(key):
                    return str(payload[key])[:300]
    except ValueError:
        pass
    return f"HTTP {response.status_code}"
