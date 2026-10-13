"""
In-Memory Sliding Window Rate Limiter
======================================
Provides rate-limiting dependencies for protected API routes.

How it works:
1. Wraps `require_api_key(required_scope)` to ensure the client is authenticated first.
2. Tracks monotonic request timestamps in-memory per API Key ID using double-ended queues (`deque`).
3. Uses a rolling time window (e.g. 60 requests per 60 seconds):
   - Discards timestamps older than `now - window_seconds`.
   - Checks if the remaining request count exceeds `max_requests`.
   - If exceeded, raises HTTP 429 with a standard `Retry-After` header.
   - If permitted, appends the current timestamp and returns the validated ApiKey.
4. Uses an `asyncio.Lock` to guarantee thread/task-safe timestamp mutations during concurrent bursts.
"""

import asyncio
import math
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, status

from app.core.api_key_dependencies import require_api_key

# In-memory storage mapping api_key_id -> deque of request timestamps (seconds)
_request_times = defaultdict(deque)

# Mutex lock to prevent race conditions during concurrent timestamp updates
_rate_limit_lock = asyncio.Lock()


def require_rate_limit(
    required_scope: str,
    max_requests: int = 60,
    window_seconds: int = 60,
):
    """
    Dependency factory combining scope-based API key verification with sliding-window rate limiting.

    Args:
        required_scope: The scope the key must possess (e.g. 'data:read').
        max_requests: Maximum allowed calls within the sliding window (default 60).
        window_seconds: Duration of the sliding window in seconds (default 60).

    Returns:
        A FastAPI dependency function that validates the key, checks limits, and returns the ApiKey.
    """
    if max_requests < 1 or window_seconds < 1:
        raise ValueError("Rate-limit values must be positive")

    # Base dependency that authenticates the API key and verifies scope
    api_key_dependency = require_api_key(required_scope)

    async def rate_limit_check(
        api_key=Depends(api_key_dependency),
    ):
        now = time.monotonic()
        cutoff = now - window_seconds

        async with _rate_limit_lock:
            timestamps = _request_times[api_key.id]

            # 1. Slide window: discard timestamps outside the current rolling window
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            # 2. Check threshold
            if len(timestamps) >= max_requests:
                # Calculate remaining seconds until the oldest request in the window expires
                retry_after = max(
                    1,
                    math.ceil(
                        timestamps[0] + window_seconds - now
                    ),
                )

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            # 3. Record current request time in the queue
            timestamps.append(now)

        return api_key

    return rate_limit_check
