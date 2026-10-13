"""
Organization Repository
=======================
Handles database queries and operations for Organization records.
"""

from typing import Optional
from prisma.models import Organization
from app.db.client import prisma


class OrganizationRepository:
    """Repository handling database operations for Organization records."""

    async def get_by_id(self, org_id: str) -> Optional[Organization]:
        """Fetch an organization record by primary key."""
        return await prisma.organization.find_unique(where={"id": org_id})

    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        """Fetch an organization record by unique slug."""
        return await prisma.organization.find_unique(where={"slug": slug})

    async def create_with_owner(
        self,
        name: str,
        slug: str,
        user_id: str,
    ) -> Organization:
        """
        Atomically creates an organization and assigns the creator as OWNER
        using a Prisma transaction.
        """
        async with prisma.tx() as transaction:
            organization = await transaction.organization.create(
                data={
                    "name": name,
                    "slug": slug,
                    "createdById": user_id,
                }
            )

            await transaction.membership.create(
                data={
                    "userId": user_id,
                    "organizationId": organization.id,
                    "role": "OWNER",
                }
            )

        return organization


organization_repository = OrganizationRepository()
