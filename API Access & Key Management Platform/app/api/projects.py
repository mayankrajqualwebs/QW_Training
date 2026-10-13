"""
Project API Module
==================
Maintains backward compatibility by forwarding to app.api.routers.projects.
"""

from app.api.routers.projects import (
    create_project,
    list_projects,
    router,
)

__all__ = [
    "router",
    "create_project",
    "list_projects",
]
