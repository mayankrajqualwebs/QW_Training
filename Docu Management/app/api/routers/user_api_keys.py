"""
User API Keys Router
====================
Provides developer-facing endpoints for regular authenticated users:
- Inspect assigned API key credentials.
- View real-time request counts and telemetry health.
- Execute one-time secure secret reveal for newly assigned keys.
- Revoke compromised keys directly.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user
from app.schemas.user_api_key import (
    UserApiKeyDetailResponse,
    UserApiKeyItem,
    UserApiKeyRevealResponse,
)
from app.services.user_api_key_service import (
    UserApiKeyService,
    user_api_key_service,
)

router = APIRouter(
    prefix="/user/api-keys",
    tags=["User API Keys"],
)


@router.get(
    "",
    response_model=list[UserApiKeyItem],
    summary="List API keys assigned to the current user",
)
async def list_assigned_api_keys(
    search: Optional[str] = Query(default=None, max_length=100),
    organization_id: Optional[str] = Query(default=None),
    project_id: Optional[str] = Query(default=None),
    key_status: Optional[str] = Query(default=None, alias="status"),
    user=Depends(get_current_user),
    service: UserApiKeyService = Depends(lambda: user_api_key_service),
):
    """
    Returns API keys where the authenticated user is the assigned credential owner.
    User ID is extracted strictly from the validated JWT session token.
    """
    return await service.list_user_api_keys(
        user_id=user.id,
        search=search,
        organization_id=organization_id,
        project_id=project_id,
        key_status=key_status,
    )


@router.get(
    "/{api_key_id}",
    response_model=UserApiKeyDetailResponse,
    summary="Get full details and telemetry logs for an assigned API key",
)
async def get_assigned_api_key_detail(
    api_key_id: str,
    user=Depends(get_current_user),
    service: UserApiKeyService = Depends(lambda: user_api_key_service),
):
    """
    Returns full metadata and recent request logs for a specific key.
    Requires caller to be the assigned owner.
    """
    return await service.get_user_api_key_detail(
        api_key_id=api_key_id,
        user_id=user.id,
    )


@router.post(
    "/{api_key_id}/reveal",
    response_model=UserApiKeyRevealResponse,
    summary="Securely reveal raw API key secret (one-time delivery)",
)
async def reveal_assigned_api_key(
    api_key_id: str,
    user=Depends(get_current_user),
    service: UserApiKeyService = Depends(lambda: user_api_key_service),
):
    """
    Delivers the raw plaintext secret key once to the authorized user.
    The secret is permanently burned from server storage upon reveal.
    """
    return await service.reveal_user_api_key(
        api_key_id=api_key_id,
        user_id=user.id,
    )


@router.post(
    "/{api_key_id}/revoke",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an assigned API key",
)
@router.delete(
    "/{api_key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an assigned API key",
)
async def revoke_assigned_api_key(
    api_key_id: str,
    user=Depends(get_current_user),
    service: UserApiKeyService = Depends(lambda: user_api_key_service),
):
    """
    Soft-revokes an active API key assigned to the authenticated user.
    """
    await service.revoke_user_api_key(
        api_key_id=api_key_id,
        user_id=user.id,
    )
    return None
