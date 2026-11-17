"""
Organization Controller
=======================
Handles HTTP requests and responses for organization provisioning and listings.
"""

from typing import Any
from fastapi import HTTPException, status
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
)
from app.services.exceptions import ConflictError
from app.services.organization_service import (
    OrganizationService,
    organization_service,
)


class OrganizationController:
    """Controller for organization tenant management."""

    def __init__(self, service: OrganizationService = organization_service):
        self.service = service

    async def create_organization(
        self,
        data: OrganizationCreate,
        user: Any,
    ) -> OrganizationResponse:
        """Handles organization creation requests."""
        try:
            return await self.service.create_organization(
                data=data,
                user_id=user.id,
            )
        except ConflictError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=exc.message,
            )

    async def list_organizations(
        self,
        user: Any,
    ) -> list[OrganizationResponse]:
        """Handles listing organizations for the authenticated user."""
        return await self.service.list_user_organizations(user_id=user.id)


organization_controller = OrganizationController()
