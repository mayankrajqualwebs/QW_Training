"""
Project Controller
==================
Handles HTTP requests and responses for project management within organizations.
"""

from typing import Any
from fastapi import HTTPException, status
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
)
from app.services.project_service import ProjectService, project_service


class ProjectController:
    """Controller for project creation and retrieval endpoints."""

    def __init__(self, service: ProjectService = project_service):
        self.service = service

    async def create_project(
        self,
        organization_id: str,
        data: ProjectCreate,
        user: Any,
    ) -> ProjectResponse:
        """Handles project creation requests within an organization."""
        try:
            return await self.service.create_project(
                organization_id=organization_id,
                data=data,
                user_id=user.id,
            )
        except NotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=exc.message,
            )
        except ForbiddenError as exc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=exc.message,
            )
        except ConflictError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=exc.message,
            )

    async def list_projects(
        self,
        organization_id: str,
        user: Any,
    ) -> list[ProjectResponse]:
        """Handles project listing requests for an organization."""
        try:
            return await self.service.list_projects(
                organization_id=organization_id,
                user_id=user.id,
            )
        except NotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=exc.message,
            )


project_controller = ProjectController()
