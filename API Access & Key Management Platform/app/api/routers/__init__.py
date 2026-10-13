"""
API Routers Package
===================
Exposes all modular route definitions for registration into the FastAPI application.
"""

from app.api.routers.analytics import router as analytics_router
from app.api.routers.api_keys import router as api_keys_router
from app.api.routers.auth import router as auth_router
from app.api.routers.health import router as health_router
from app.api.routers.organizations import router as organizations_router
from app.api.routers.projects import router as projects_router
from app.api.routers.usage import router as usage_router

__all__ = [
    "analytics_router",
    "api_keys_router",
    "auth_router",
    "health_router",
    "organizations_router",
    "projects_router",
    "usage_router",
]
