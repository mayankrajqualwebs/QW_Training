"""
Membership Repository
=====================
Handles database queries and operations for Organization Membership records.
"""

from typing import Optional
from prisma.models import Membership
from app.db.client import prisma


class MembershipRepository:
    """Repository handling database operations for user organization memberships."""

    async def get_by_user_and_org(
        self,
        user_id: str,
        organization_id: str,
    ) -> Optional[Membership]:
        """Fetch a specific membership record by user ID and organization ID."""
        return await prisma.membership.find_unique(
            where={
                "userId_organizationId": {
                    "userId": user_id,
                    "organizationId": organization_id,
                }
            }
        )

    async def list_by_user(self, user_id: str) -> list[Membership]:
        """Fetch all organization memberships for a user, eagerly including organization data."""
        return await prisma.membership.find_many(
            where={"userId": user_id},
            include={"organization": True},
        )


membership_repository = MembershipRepository()
