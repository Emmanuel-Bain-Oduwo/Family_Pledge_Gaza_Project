from typing import Any, Optional


def ok(message: str, data: Optional[Any] = None) -> dict:
    result: dict = {"message": message}
    if data is not None:
        result["data"] = data
    return result
