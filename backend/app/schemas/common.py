import math
from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


class MessageResponse(BaseModel):
    message: str


def make_page(items: list, total: int, page: int, size: int) -> dict:
    pages = math.ceil(total / size) if size > 0 else 0
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}
