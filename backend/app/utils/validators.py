import re
from datetime import datetime, timezone


def validate_month_format(value: str) -> bool:
    return bool(re.match(r"^\d{4}-(0[1-9]|1[0-2])$", value))


def current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")
