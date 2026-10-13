"""
API Key Controller
==================
Handles HTTP requests, scope validation responses, and lifecycle operations for API keys.
"""

from typing import Any
from fastapi import HTTPException, status
from app.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyCreatedResponse,
    ApiKeyResponse,
)
from app.services.api_key_service import ApiKeyService, api_key_service
from app.services.exceptions import (
    ForbiddenError,
    NotFoundError,
    ValidationError,
)


class ApiKeyController:
    """Controller for API key creation, retrieval, and revocation endpoints."""

    def __init__(self, service: ApiKeyService = api_key_service):
        self.service = service

    async def create_api_key(
        self,
        organization_id: str,
        project_id: str,
        data: ApiKeyCreate,
        user: Any,
    ) -> ApiKeyCreatedResponse:
        """Handles provisioning of a new API key."""
        try:
            return await self.service.create_api_key(
                organization_id=organization_id,
                project_id=project_id,
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
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=exc.message,
            )

    async def list_api_keys(
        self,
        organization_id: str,
        project_id: str,
        user: Any,
    ) -> list[ApiKeyResponse]:
        """Handles listing all API keys belonging to a project."""
        try:
            return await self.service.list_api_keys(
                organization_id=organization_id,
                project_id=project_id,
                user_id=user.id,
            )
        except NotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=exc.message,
            )

    async def revoke_api_key(
        self,
        organization_id: str,
        project_id: str,
        api_key_id: str,
        user: Any,
    ) -> None:
        """Handles revocation of an active API key."""
        try:
            await self.service.revoke_api_key(
                organization_id=organization_id,
                project_id=project_id,
                api_key_id=api_key_id,
                user_id=user.id,
            )
            return None
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


api_key_controller = ApiKeyController()
