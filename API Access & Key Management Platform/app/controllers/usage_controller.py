"""
Usage Controller
================
Handles HTTP requests and responses for protected API resources.
"""

from typing import Any
from fastapi import HTTPException, status
from app.services.exceptions import ForbiddenError
from app.services.usage_service import UsageService, usage_service


class UsageController:
    """Controller for consumer-facing protected API data endpoints."""

    def __init__(self, service: UsageService = usage_service):
        self.service = service

    def get_project_data(
        self,
        project_id: str,
        api_key: Any,
    ) -> dict[str, Any]:
        """Handles protected resource queries with project boundary isolation."""
        try:
            return self.service.get_project_data(
                project_id=project_id,
                api_key=api_key,
            )
        except ForbiddenError as exc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=exc.message,
            )


usage_controller = UsageController()
