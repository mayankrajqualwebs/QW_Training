"""
Health API Module
=================
Maintains backward compatibility by forwarding to app.api.routers.health.
"""

from app.api.routers.health import health_check, database_health_check, router

__all__ = ["router", "health_check", "database_health_check"]