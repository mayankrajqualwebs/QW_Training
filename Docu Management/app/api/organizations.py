"""
Organization API Module
=======================
Maintains backward compatibility by forwarding to app.api.routers.organizations.
"""

from app.api.routers.organizations import (
    create_organization,
    list_organizations,
    router,
)

__all__ = [
    "router",
    "create_organization",
    "list_organizations",
]
