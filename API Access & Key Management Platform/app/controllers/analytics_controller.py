"""
Analytics Controller
====================
Handles HTTP requests and responses for project usage analytics and telemetry metrics.
"""

from typing import Any
from fastapi import HTTPException, status
from app.schemas.analytics import UsageSummary
from app.services.analytics_service import AnalyticsService, analytics_service
from app.services.exceptions import NotFoundError


class AnalyticsController:
    """Controller for telemetry and usage metrics endpoints."""

    def __init__(self, service: AnalyticsService = analytics_service):
        self.service = service

    async def get_usage_summary(
        self,
        organization_id: str,
        project_id: str,
        days: int,
        user: Any,
    ) -> UsageSummary:
        """Handles retrieval of aggregated project telemetry summary."""
        try:
            return await self.service.get_usage_summary(
                organization_id=organization_id,
                project_id=project_id,
                user_id=user.id,
                days=days,
            )
        except NotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=exc.message,
            )


analytics_controller = AnalyticsController()
