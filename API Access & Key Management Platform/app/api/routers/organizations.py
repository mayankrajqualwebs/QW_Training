"""
Organization API Router
=======================
Defines HTTP routes for organization creation and membership listing.
Delegates request execution to OrganizationController.
"""

from fastapi import APIRouter, Depends, status

from app.controllers.organization_controller import organization_controller
from app.core.dependencies import get_current_user
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
)

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization(
    data: OrganizationCreate,
    user=Depends(get_current_user),
):
    """
    Creates a new organization workspace and assigns the caller as OWNER.
    """
    return await organization_controller.create_organization(data=data, user=user)


@router.get(
    "",
    response_model=list[OrganizationResponse],
)
async def list_organizations(
    user=Depends(get_current_user),
):
    """
    Lists all organizations the authenticated user belongs to.
    """
    return await organization_controller.list_organizations(user=user)
