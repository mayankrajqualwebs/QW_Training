"""
Usage API Module
================
Maintains backward compatibility by forwarding to app.api.routers.usage.
"""

from app.api.routers.usage import get_project_data, router

__all__ = ["router", "get_project_data"]
