"""
API Key Router
==============
Defines HTTP routes for provisioning, listing, and revoking project API keys.
Delegates request execution to ApiKeyController.
"""

from fastapi import APIRouter, Depends, status

from app.controllers.api_key_controller import api_key_controller
from app.core.dependencies import get_current_user
from app.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyCreatedResponse,
    ApiKeyResponse,
)

router = APIRouter(
    prefix="/organizations/{organization_id}/projects/{project_id}/api-keys",
    tags=["API Keys"],
)


@router.post(
    "",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_api_key(
    organization_id: str,
    project_id: str,
    data: ApiKeyCreate,
    user=Depends(get_current_user),
):
    """
    Provisions a new API key for the specified project.
    Returns the complete plaintext key once only upon creation.
    """
    return await api_key_controller.create_api_key(
        organization_id=organization_id,
        project_id=project_id,
        data=data,
        user=user,
    )


@router.get(
    "",
    response_model=list[ApiKeyResponse],
)
async def list_api_keys(
    organization_id: str,
    project_id: str,
    user=Depends(get_current_user),
):
    """
    Lists all API keys for a project with redacted secrets.
    """
    return await api_key_controller.list_api_keys(
        organization_id=organization_id,
        project_id=project_id,
        user=user,
    )


@router.delete(
    "/{api_key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_api_key(
    organization_id: str,
    project_id: str,
    api_key_id: str,
    user=Depends(get_current_user),
):
    """
    Soft-revokes an active API key by marking its revocation timestamp.
    """
    return await api_key_controller.revoke_api_key(
        organization_id=organization_id,
        project_id=project_id,
        api_key_id=api_key_id,
        user=user,
    )
