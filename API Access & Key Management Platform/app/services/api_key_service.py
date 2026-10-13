"""
API Key Service
===============
Business logic for generating, managing, verifying, and revoking project API keys.
"""

from datetime import datetime, timezone
from typing import Optional, Set

from prisma.models import ApiKey, Membership, Project
from app.core.security import generate_api_key, hash_api_key
from app.repositories.api_key_repository import (
    ApiKeyRepository,
    api_key_repository,
)
from app.repositories.membership_repository import (
    MembershipRepository,
    membership_repository,
)
from app.repositories.project_repository import (
    ProjectRepository,
    project_repository,
)
from app.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyCreatedResponse,
    ApiKeyResponse,
)
from app.services.exceptions import (
    ForbiddenError,
    NotFoundError,
    ValidationError,
)

ALLOWED_SCOPES: Set[str] = {
    "data:read",
    "data:write",
    "usage:read",
}

KEY_CREATION_ROLES: Set[str] = {"OWNER", "ADMIN", "DEVELOPER"}


def to_api_key_response(key: ApiKey) -> ApiKeyResponse:
    """Helper that serializes a Prisma ApiKey record into a safe, secret-free response model."""
    return ApiKeyResponse(
        id=key.id,
        name=key.name,
        key_prefix=key.keyPrefix,
        scopes=key.scopes,
        expires_at=key.expiresAt,
        last_used_at=key.lastUsedAt,
        revoked_at=key.revokedAt,
        created_at=key.createdAt,
    )


class ApiKeyService:
    """Service handling API key lifecycles, hashing, and authorization boundaries."""

    def __init__(
        self,
        api_key_repo: ApiKeyRepository = api_key_repository,
        membership_repo: MembershipRepository = membership_repository,
        project_repo: ProjectRepository = project_repository,
    ):
        self.api_key_repo = api_key_repo
        self.membership_repo = membership_repo
        self.project_repo = project_repo

    async def get_membership_or_raise(
        self,
        organization_id: str,
        user_id: str,
    ) -> Membership:
        """Verifies organization membership or raises NotFoundError."""
        membership = await self.membership_repo.get_by_user_and_org(
            user_id=user_id,
            organization_id=organization_id,
        )
        if membership is None:
            raise NotFoundError("Organization not found")
        return membership

    async def get_project_or_raise(
        self,
        organization_id: str,
        project_id: str,
    ) -> Project:
        """Verifies project exists and belongs to the given organization."""
        project = await self.project_repo.get_by_id(project_id)
        if project is None or project.organizationId != organization_id:
            raise NotFoundError("Project not found")
        return project

    async def create_api_key(
        self,
        organization_id: str,
        project_id: str,
        data: ApiKeyCreate,
        user_id: str,
    ) -> ApiKeyCreatedResponse:
        """
        Provisions a new API key.
        Generates high-entropy key, hashes it, stores in database, and returns the plaintext key once.
        """
        membership = await self.get_membership_or_raise(organization_id, user_id)
        role = getattr(membership.role, "value", membership.role)

        if role not in KEY_CREATION_ROLES:
            raise ForbiddenError("Your organization role cannot create API keys")

        await self.get_project_or_raise(organization_id, project_id)

        # Validate scopes
        if len(set(data.scopes)) != len(data.scopes):
            raise ValidationError("Duplicate scopes are not allowed")

        invalid_scopes = set(data.scopes) - ALLOWED_SCOPES
        if invalid_scopes:
            raise ValidationError({
                "message": "Unsupported scope",
                "allowed_scopes": sorted(ALLOWED_SCOPES),
            })

        # Validate expiration timestamp
        expires_at = data.expires_at
        if expires_at is not None:
            if expires_at.tzinfo is None:
                raise ValidationError("expires_at must include a timezone")

            if expires_at <= datetime.now(timezone.utc):
                raise ValidationError("expires_at must be in the future")

        raw_key = generate_api_key()
        key_hash = hash_api_key(raw_key)
        key_prefix = raw_key[:16]

        key = await self.api_key_repo.create(
            name=data.name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            scopes=data.scopes,
            project_id=project_id,
            created_by_id=user_id,
            expires_at=expires_at,
        )

        return ApiKeyCreatedResponse(
            id=key.id,
            name=key.name,
            key_prefix=key.keyPrefix,
            api_key=raw_key,
            scopes=key.scopes,
            expires_at=key.expiresAt,
            last_used_at=key.lastUsedAt,
            revoked_at=key.revokedAt,
            created_at=key.createdAt,
        )

    async def list_api_keys(
        self,
        organization_id: str,
        project_id: str,
        user_id: str,
    ) -> list[ApiKeyResponse]:
        """Lists all API keys for a project (public fields only)."""
        await self.get_membership_or_raise(organization_id, user_id)
        await self.get_project_or_raise(organization_id, project_id)

        keys = await self.api_key_repo.list_by_project(project_id)
        return [to_api_key_response(key) for key in keys]

    async def revoke_api_key(
        self,
        organization_id: str,
        project_id: str,
        api_key_id: str,
        user_id: str,
    ) -> None:
        """
        Soft-revokes an active API key.
        Enforces that only OWNER/ADMIN or key creator can perform revocation.
        """
        membership = await self.get_membership_or_raise(organization_id, user_id)
        await self.get_project_or_raise(organization_id, project_id)

        key = await self.api_key_repo.get_by_id(api_key_id)
        if key is None or key.projectId != project_id:
            raise NotFoundError("API key not found")

        role = getattr(membership.role, "value", membership.role)
        if role not in {"OWNER", "ADMIN"} and key.createdById != user_id:
            raise ForbiddenError("You cannot revoke this API key")

        if key.revokedAt is None:
            await self.api_key_repo.soft_revoke(
                api_key_id=api_key_id,
                revoked_at=datetime.now(timezone.utc),
            )


api_key_service = ApiKeyService()
