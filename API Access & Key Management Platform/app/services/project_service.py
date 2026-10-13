"""
Project Service
===============
Business logic for project provisioning, scoping, and authorization.
"""

from typing import Set
from prisma.models import Membership
from app.repositories.membership_repository import (
    MembershipRepository,
    membership_repository,
)
from app.repositories.project_repository import (
    ProjectRepository,
    project_repository,
)
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
)

PROJECT_CREATION_ROLES: Set[str] = {"OWNER", "ADMIN", "DEVELOPER"}


class ProjectService:
    """Service handling project management under organization tenants."""

    def __init__(
        self,
        project_repo: ProjectRepository = project_repository,
        membership_repo: MembershipRepository = membership_repository,
    ):
        self.project_repo = project_repo
        self.membership_repo = membership_repo

    async def get_membership_or_raise(
        self,
        organization_id: str,
        user_id: str,
    ) -> Membership:
        """
        Verifies user membership in the organization.
        Raises NotFoundError if not a member (obscuring existence for security).
        """
        membership = await self.membership_repo.get_by_user_and_org(
            user_id=user_id,
            organization_id=organization_id,
        )
        if membership is None:
            raise NotFoundError("Organization not found")
        return membership

    async def create_project(
        self,
        organization_id: str,
        data: ProjectCreate,
        user_id: str,
    ) -> ProjectResponse:
        """
        Creates a new project within the target organization.
        Enforces membership, role authorization, and org-scoped slug uniqueness.
        """
        membership = await self.get_membership_or_raise(
            organization_id=organization_id,
            user_id=user_id,
        )

        role = getattr(membership.role, "value", membership.role)
        if role not in PROJECT_CREATION_ROLES:
            raise ForbiddenError("Your organization role cannot create projects")

        existing = await self.project_repo.get_by_org_and_slug(
            organization_id=organization_id,
            slug=data.slug,
        )
        if existing is not None:
            raise ConflictError(
                "Project slug already exists in this organization"
            )

        project = await self.project_repo.create(
            organization_id=organization_id,
            name=data.name,
            slug=data.slug,
        )

        return ProjectResponse(
            id=project.id,
            name=project.name,
            slug=project.slug,
            organization_id=project.organizationId,
        )

    async def list_projects(
        self,
        organization_id: str,
        user_id: str,
    ) -> list[ProjectResponse]:
        """Lists all projects for the specified organization."""
        await self.get_membership_or_raise(
            organization_id=organization_id,
            user_id=user_id,
        )

        projects = await self.project_repo.list_by_organization(
            organization_id=organization_id
        )

        return [
            ProjectResponse(
                id=project.id,
                name=project.name,
                slug=project.slug,
                organization_id=project.organizationId,
            )
            for project in projects
        ]


project_service = ProjectService()
