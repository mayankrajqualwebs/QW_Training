"""
Health Service
==============
Business logic for system health and connectivity verification.
"""

from app.repositories.health_repository import (
    HealthRepository,
    health_repository,
)
from app.services.exceptions import ServiceUnavailableError


class HealthService:
    """Service handling application liveness and database readiness checks."""

    def __init__(self, repo: HealthRepository = health_repository):
        self.health_repo = repo

    def get_app_health(self) -> dict[str, str]:
        """Returns application process liveness status."""
        return {
            "status": "healthy",
            "service": "API Access & Key Management Platform",
        }

    async def check_database_health(self) -> dict[str, str]:
        """
        Executes a database connectivity check.
        Returns status dictionary on success, or raises ServiceUnavailableError on failure.
        """
        try:
            await self.health_repo.ping_database()
            return {
                "status": "healthy",
                "database": "connected",
            }
        except Exception as exc:
            raise ServiceUnavailableError(
                message={
                    "status": "unhealthy",
                    "database": "unavailable",
                }
            ) from exc


health_service = HealthService()
