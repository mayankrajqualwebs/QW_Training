"""
Analytics API Module
====================
Maintains backward compatibility by forwarding to app.api.routers.analytics.
"""

from app.api.routers.analytics import get_usage_summary, router

__all__ = ["router", "get_usage_summary"]
