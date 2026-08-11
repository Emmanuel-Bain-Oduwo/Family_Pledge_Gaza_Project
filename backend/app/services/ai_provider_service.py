import base64
import logging
from typing import Any

from fastapi import HTTPException

from app.core.config import settings

log = logging.getLogger(__name__)


def _openai_client(*, api_key: str, base_url: str = ""):
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise HTTPException(503, "AI client package is not installed") from exc

    kwargs: dict[str, Any] = {"api_key": api_key, "timeout": 35.0}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


def call_ai(
    *,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 900,
    temperature: float = 0.35,
) -> str:
    """Call the configured text-only OpenAI-compatible provider."""
    try:
        from openai import APITimeoutError, AuthenticationError, RateLimitError
    except ImportError as exc:
        raise HTTPException(503, "AI client package is not installed") from exc

    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "AI provider is not configured")

    client = _openai_client(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return (response.choices[0].message.content or "").strip()
    except AuthenticationError as exc:
        log.error("AI provider authentication failed")
        raise HTTPException(502, "AI provider authentication failed") from exc
    except RateLimitError as exc:
        raise HTTPException(429, "AI service is busy. Please try again shortly.") from exc
    except APITimeoutError as exc:
        raise HTTPException(504, "AI service timed out. Please try again.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        log.error("AI provider call failed: %s", exc)
        raise HTTPException(502, "AI provider request failed") from exc


def call_vision_ai(
    *,
    prompt: str,
    image_bytes: bytes,
    content_type: str,
    max_tokens: int = 1000,
) -> str:
    """Analyze one admin-provided image with an optional OVH/OpenAI-compatible VLM.

    Images are sent directly to the configured provider as a data URL and are not
    persisted by this helper. The model/base URL are environment-controlled so
    Family Pledge can switch OVH catalog models without another code change.
    """
    try:
        from openai import APITimeoutError, AuthenticationError, RateLimitError
    except ImportError as exc:
        raise HTTPException(503, "AI client package is not installed") from exc

    api_key = settings.AI_VISION_API_KEY or settings.OPENAI_API_KEY
    base_url = settings.AI_VISION_BASE_URL or settings.OPENAI_BASE_URL
    model = settings.AI_VISION_MODEL.strip()
    if not api_key or not model:
        raise HTTPException(503, "Vision AI is not configured yet")

    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Vision AI accepts JPG, PNG, or WebP images")
    max_bytes = settings.AI_VISION_MAX_IMAGE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(413, f"Image must be {settings.AI_VISION_MAX_IMAGE_MB} MB or smaller")

    encoded = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{content_type};base64,{encoded}"
    client = _openai_client(api_key=api_key, base_url=base_url)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the Family Pledge admin visual assistant. Describe and reason only from "
                        "the supplied image and the admin's request. Do not invent names, payment details, "
                        "religious citations, or facts that are not visible. Return clean readable text."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            max_tokens=max_tokens,
            temperature=0.2,
        )
        return (response.choices[0].message.content or "").strip()
    except AuthenticationError as exc:
        log.error("Vision AI provider authentication failed")
        raise HTTPException(502, "Vision AI provider authentication failed") from exc
    except RateLimitError as exc:
        raise HTTPException(429, "Vision AI is busy. Please try again shortly.") from exc
    except APITimeoutError as exc:
        raise HTTPException(504, "Vision AI timed out. Please try again.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        log.error("Vision AI provider call failed: %s", exc)
        raise HTTPException(502, "Vision AI provider request failed") from exc
