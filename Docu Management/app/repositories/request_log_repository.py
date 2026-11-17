"""
Request Log Repository
======================
Handles database queries and operations for RequestLog telemetry records.
"""

from datetime import datetime
from typing import Optional
from prisma.models import RequestLog
from app.db.client import prisma


class RequestLogRepository:
    """Repository handling database operations for RequestLog audit and telemetry records."""

    async def create(
        self,
        project_id: str,
        method: str,
        path: str,
        status_code: int,
        latency_ms: int,
        api_key_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> RequestLog:
        """Persist a new telemetry request log entry."""
        return await prisma.requestlog.create(
            data={
                "projectId": project_id,
                "apiKeyId": api_key_id,
                "method": method,
                "path": path,
                "statusCode": status_code,
                "latencyMs": latency_ms,
                "ipAddress": ip_address,
            }
        )

    async def list_by_project_since(
        self,
        project_id: str,
        since: datetime,
    ) -> list[RequestLog]:
        """Fetch all request logs for a project created on or after the specified timestamp."""
        return await prisma.requestlog.find_many(
            where={
                "projectId": project_id,
                "createdAt": {"gte": since},
            },
            order={"createdAt": "desc"},
        )


request_log_repository = RequestLogRepository()
