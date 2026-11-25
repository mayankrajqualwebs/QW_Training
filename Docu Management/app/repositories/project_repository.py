
"""
Project Repository
==================
Handles database queries and operations for Project records
and organization membership.
"""

from typing import Optional

from prisma.models import Project

from app.db.client import prisma


class ProjectRepository:
    """Repository for projects and project-level access checks."""

    # -----------------------------------------------------------------
    # Project Retrieval
    # -----------------------------------------------------------------

    async def get_project_by_id(
        self,
        project_id: str,
    ) -> Optional[Project]:
        """Fetch a project by ID, including its organization."""

        return await prisma.project.find_unique(
            where={
                "id": project_id,
            },
            include={
                "organization": True,
            },
        )

    async def get_by_id(
        self,
        project_id: str,
    ) -> Optional[Project]:
        """Fetch a project by primary key."""

        return await self.get_project_by_id(project_id)

    async def get_by_org_and_slug(
        self,
        organization_id: str,
        slug: str,
    ) -> Optional[Project]:
        """Fetch a project using its organization ID and slug."""

        return await prisma.project.find_unique(
            where={
                "organizationId_slug": {
                    "organizationId": organization_id,
                    "slug": slug,
                }
            }
        )

    # -----------------------------------------------------------------
    # Membership and Authorization
    # -----------------------------------------------------------------

    async def get_user_membership(
        self,
        organization_id: str,
        user_id: str,
    ):
        """
        Retrieve a user's membership in an organization.

        Returns the membership and its role, or None if the user
        is not a member.
        """

        return await prisma.membership.find_unique(
            where={
                "userId_organizationId": {
                    "userId": user_id,
                    "organizationId": organization_id,
                }
            }
        )

    # -----------------------------------------------------------------
    # Project Creation
    # -----------------------------------------------------------------

    async def create(
        self,
        organization_id: str,
        name: str,
        slug: str,
    ) -> Project:
        """Create and persist a new project."""

        return await prisma.project.create(
            data={
                "name": name,
                "slug": slug,
                "organizationId": organization_id,
            }
        )

    # -----------------------------------------------------------------
    # Project Listing
    # -----------------------------------------------------------------

    async def list_by_organization(
        self,
        organization_id: str,
    ) -> list[Project]:
        """Fetch projects belonging to an organization."""

        return await prisma.project.find_many(
            where={
                "organizationId": organization_id,
            },
            order={
                "createdAt": "desc",
            },
        )

    
    # -----------------------------------------------------------------
    # Platform-wide Project Listing (Admin)
    # -----------------------------------------------------------------

    async def list_all_projects(
        self,
        search: Optional[str] = None,
        organization_id: Optional[str] = None,
        skip: int = 0,
        take: int = 20,
    ) -> list[Project]:
        """
        Fetch projects across all organizations.

        Intended for platform administrators.
        Authorization is handled by the admin service/controller.
        """

        where = {}

        if search:
            where["name"] = {
                "contains": search.strip(),
                "mode": "insensitive",
            }

        if organization_id:
            where["organizationId"] = organization_id

        return await prisma.project.find_many(
            where=where,
            include={
                "organization": True,
            },
            skip=skip,
            take=take,
            order={
                "createdAt": "desc",
            },
        )

    async def count_all_projects(
        self,
        search: Optional[str] = None,
        organization_id: Optional[str] = None,
    ) -> int:
        """Count projects using the same filters as the admin listing."""

        where = {}

        if search:
            where["name"] = {
                "contains": search.strip(),
                "mode": "insensitive",
            }

        if organization_id:
            where["organizationId"] = organization_id

        return await prisma.project.count(
            where=where,
        )



# ---------------------------------------------------------------------
# Shared Repository Instance
# ---------------------------------------------------------------------

project_repository = ProjectRepository()
