"""
Health Repository
=================
Handles database connectivity and readiness queries.
"""

from app.db.client import prisma


class HealthRepository:
    """Repository handling raw database liveness and ping checks."""

    async def ping_database(self) -> None:
        """Executes a minimal test query against PostgreSQL using Prisma."""
        await prisma.query_raw("SELECT 1")


health_repository = HealthRepository()
