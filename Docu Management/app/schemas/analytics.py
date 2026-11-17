"""
Analytics and Usage Telemetry Schemas
=====================================
Defines Pydantic models for reporting aggregated request logs and API performance.

Used by `app/api/analytics.py` to serialize usage summaries calculated from `RequestLog` entries.
"""

from pydantic import BaseModel


class UsageSummary(BaseModel):
    """
    Aggregated usage and telemetry statistics for a specific project over a time window.
    """
    project_id: str
    period_days: int                   # Number of days queried (e.g. 7, 14, 30)
    total_requests: int                # Total HTTP requests recorded
    successful_requests: int           # Count of 2xx and 3xx responses
    error_requests: int                # Count of 4xx and 5xx responses
    average_latency_ms: float          # Mean request processing duration in milliseconds
    error_rate_percent: float          # Percentage of total requests resulting in errors
    status_code_breakdown: dict[str, int]  # Distribution map, e.g. {"200": 150, "401": 3, "429": 1}
