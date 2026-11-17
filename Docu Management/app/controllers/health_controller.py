"""
Health Controller
=================
Handles HTTP requests and responses for health and readiness probes.
"""

from fastapi import HTTPException, status
from app.services.exceptions import ServiceUnavailableError
from app.services.health_service import HealthService, health_service


class HealthController:
    """Controller for application and database health endpoints."""

    def __init__(self, service: HealthService = health_service):
        self.service = service

    def check_health(self) -> dict[str, str]:
        """Application liveness check handler."""
        return self.service.get_app_health()

    async def check_database(self) -> dict[str, str]:
        """Database connectivity readiness check handler."""
        try:
            return await self.service.check_database_health()
        except ServiceUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=exc.message if isinstance(exc.message, dict) else {
                    "status": "unhealthy",
                    "database": "unavailable",
                },
            )


health_controller = HealthController()
