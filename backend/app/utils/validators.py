import re
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse


def validate_month_format(value: str) -> bool:
    return bool(re.match(r"^\d{4}-(0[1-9]|1[0-2])$", value))


def current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


# ── Media URL validation ───────────────────────────────────────────────────────

_YOUTUBE_PATTERNS = [
    re.compile(r"^https?://(?:www\.)?youtube\.com/watch\?.*v=[\w-]+", re.I),
    re.compile(r"^https?://youtu\.be/[\w-]+", re.I),
    re.compile(r"^https?://(?:www\.)?youtube\.com/embed/[\w-]+", re.I),
    re.compile(r"^https?://(?:www\.)?youtube\.com/shorts/[\w-]+", re.I),
]


def is_youtube_url(url: str) -> bool:
    """Return True if the URL is a valid YouTube watch/embed/shorts link."""
    return any(p.match(url) for p in _YOUTUBE_PATTERNS)


def is_valid_media_url(url: Optional[str]) -> bool:
    """
    Return True if the URL is acceptable for storage:
    must be an absolute HTTPS media URL or a YouTube link.
    Empty/None values are valid (field is optional).
    """
    if not url:
        return True
    parsed = urlparse(url)
    return (parsed.scheme == "https" and bool(parsed.netloc)) or is_youtube_url(url)


def media_url_error(url: Optional[str]) -> Optional[str]:
    """Return a human-readable error string, or None if valid."""
    if not url:
        return None
    if is_valid_media_url(url):
        return None
    return (
        "Invalid media URL. Use an absolute HTTPS Cloudflare R2/media URL "
        "or a supported external media link."
    )
