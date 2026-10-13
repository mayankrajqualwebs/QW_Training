"""
Project Repository
==================
Handles database queries and operations for Project records.
"""

from typing import Optional
from prisma.models import Project
from app.db.client import prisma


class ProjectRepository:
    """Repository handling database operations for Project records."""

    async def get_by_id(self, project_id: str) -> Optional[Project]:
        """Fetch a project by primary key."""
        return await prisma.project.find_unique(where={"id": project_id})

    async def get_by_org_and_slug(
        self,
        organization_id: str,
        slug: str,
    ) -> Optional[Project]:
        """Fetch a project by compound key (organizationId, slug)."""
        return await prisma.project.find_unique(
            where={
                "organizationId_slug": {
                    "organizationId": organization_id,
                    "slug": slug,
                }
            }
        )

    async def create(
        self,
        organization_id: str,
        name: str,
        slug: str,
    ) -> Project:
        """Create and persist a new project record."""
        return await prisma.project.create(
            data={
                "name": name,
                "slug": slug,
                "organizationId": organization_id,
            }
        )

    async def list_by_organization(
        self,
        organization_id: str,
    ) -> list[Project]:
        """Fetch all projects belonging to an organization, ordered by creation date descending."""
        return await prisma.project.find_many(
            where={"organizationId": organization_id},
            order={"createdAt": "desc"},
        )


project_repository = ProjectRepository()
