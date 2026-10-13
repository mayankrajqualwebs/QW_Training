"""
Usage Service
=============
Business logic for protected API data access and tenant boundary enforcement.
"""

from typing import Any
from app.services.exceptions import ForbiddenError


class UsageService:
    """Service handling access to protected project resource payloads."""

    def get_project_data(
        self,
        project_id: str,
        api_key: Any,
    ) -> dict[str, Any]:
        """
        Validates cross-project isolation boundary and returns protected data payload.
        """
        if api_key.projectId != project_id:
            raise ForbiddenError("API key cannot access this project")

        return {
            "message": "API key authenticated successfully",
            "project_id": project_id,
            "key_name": api_key.name,
            "data": {
                "status": "ok",
            },
        }


usage_service = UsageService()
