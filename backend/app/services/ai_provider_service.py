import logging
from typing import Any

from fastapi import HTTPException

from app.core.config import settings

log = logging.getLogger(__name__)


def call_ai(
    *,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 900,
    temperature: float = 0.35,
) -> str:
    """Call the configured OpenAI-compatible provider.

    Family Pledge currently uses the existing OVH OpenAI-compatible endpoint and
    `gpt-oss-120b`. Provider credentials remain backend-only. This helper is for
    internal admin chat/task workflows that need a system prompt different from
    the public-content drafting prompt in ai_service.py.
    """
    try:
        from openai import APITimeoutError, AuthenticationError, OpenAI, RateLimitError
    except ImportError as exc:
        raise HTTPException(503, "AI client package is not installed") from exc

    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "AI provider is not configured")

    kwargs: dict[str, Any] = {
        "api_key": settings.OPENAI_API_KEY,
        "timeout": 35.0,
    }
    if settings.OPENAI_BASE_URL:
        kwargs["base_url"] = settings.OPENAI_BASE_URL
    client = OpenAI(**kwargs)

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
