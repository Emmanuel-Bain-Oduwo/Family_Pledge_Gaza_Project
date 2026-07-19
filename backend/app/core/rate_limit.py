import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status

class RateLimiter:
    def __init__(self):
        # Map client IP -> (count, window_start_time)
        self.requests: Dict[str, Tuple[int, float]] = {}

    def limit(self, max_requests: int, window_seconds: int):
        async def limiter(request: Request):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            if client_ip in self.requests:
                count, start = self.requests[client_ip]
                if now - start > window_seconds:
                    # Window expired, reset
                    self.requests[client_ip] = (1, now)
                else:
                    if count >= max_requests:
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail="Too many requests. Please try again later."
                        )
                    else:
                        self.requests[client_ip] = (count + 1, start)
            else:
                self.requests[client_ip] = (1, now)
            return None
        return limiter

# Global instance to share across routes
rate_limiter = RateLimiter()
