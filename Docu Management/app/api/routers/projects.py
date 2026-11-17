"""
Project API Router
==================
Defines HTTP routes for managing projects scoped under organizations.
Delegates request execution to ProjectController.
"""

from fastapi import APIRouter, Depends, status

from app.controllers.project_controller import project_controller
from app.core.dependencies import get_current_user
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter(
    prefix="/organizations/{organization_id}/projects",
    tags=["Projects"],
)


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    organization_id: str,
    data: ProjectCreate,
    user=Depends(get_current_user),
):
    """
    Creates a new project scoped to the target organization.
    Requires OWNER, ADMIN, or DEVELOPER role.
    """
    return await project_controller.create_project(
        organization_id=organization_id,
        data=data,
        user=user,
    )


@router.get(
    "",
    response_model=list[ProjectResponse],
)
async def list_projects(
    organization_id: str,
    user=Depends(get_current_user),
):
    """
    Lists all projects belonging to the specified organization.
    """
    return await project_controller.list_projects(
        organization_id=organization_id,
        user=user,
    )
