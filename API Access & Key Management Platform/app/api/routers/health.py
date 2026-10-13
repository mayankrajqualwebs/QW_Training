"""
Health Check API Router
=======================
Defines HTTP routes for system liveness and database readiness probes.
Delegates request handling to HealthController.
"""

from fastapi import APIRouter
from app.controllers.health_controller import health_controller

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("", include_in_schema=False)
@router.get("/")
async def health_check():
    """
    Application liveness probe.
    Returns 200 OK if the application process is running.
    """
    return health_controller.check_health()


@router.get("/database")
async def database_health_check():
    """
    Database readiness probe.
    Verifies that the PostgreSQL database connection pool is active and healthy.
    """
    return await health_controller.check_database()
