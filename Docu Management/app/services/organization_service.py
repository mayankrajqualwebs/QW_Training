"""
Organization Service
====================
Business logic for organization creation, membership lookup, and tenant isolation.
"""

from app.repositories.membership_repository import (
    MembershipRepository,
    membership_repository,
)
from app.repositories.organization_repository import (
    OrganizationRepository,
    organization_repository,
)
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
)
from app.services.exceptions import ConflictError


class OrganizationService:
    """Service handling multi-tenant organization provisioning and listings."""

    def __init__(
        self,
        org_repo: OrganizationRepository = organization_repository,
        membership_repo: MembershipRepository = membership_repository,
    ):
        self.org_repo = org_repo
        self.membership_repo = membership_repo

    async def create_organization(
        self,
        data: OrganizationCreate,
        user_id: str,
    ) -> OrganizationResponse:
        """
        Creates an organization and establishes the creator as OWNER.
        Enforces global slug uniqueness.
        """
        existing = await self.org_repo.get_by_slug(data.slug)
        if existing is not None:
            raise ConflictError("Organization slug already exists")

        organization = await self.org_repo.create_with_owner(
            name=data.name,
            slug=data.slug,
            user_id=user_id,
        )

        return OrganizationResponse(
            id=organization.id,
            name=organization.name,
            slug=organization.slug,
            role="OWNER",
        )

    async def list_user_organizations(
        self,
        user_id: str,
    ) -> list[OrganizationResponse]:
        """Lists all organizations the user is an active member of."""
        memberships = await self.membership_repo.list_by_user(user_id)

        return [
            OrganizationResponse(
                id=membership.organization.id,
                name=membership.organization.name,
                slug=membership.organization.slug,
                role=membership.role,
            )
            for membership in memberships
        ]


organization_service = OrganizationService()
