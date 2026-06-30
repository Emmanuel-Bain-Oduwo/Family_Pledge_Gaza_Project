import math
from typing import Any, Dict, List, Tuple


def paginate(items: List[Any], total: int, page: int, size: int) -> Dict[str, Any]:
    pages = math.ceil(total / size) if size > 0 else 0
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}


def offset_limit(page: int, size: int) -> Tuple[int, int]:
    page = max(1, page)
    size = max(1, min(size, 100))
    return (page - 1) * size, size
