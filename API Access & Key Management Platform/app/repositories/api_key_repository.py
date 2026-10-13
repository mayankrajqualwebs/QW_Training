"""
API Key Repository
==================
Handles database queries and operations for ApiKey records.
"""

from datetime import datetime
from typing import Optional
from prisma.models import ApiKey
from app.db.client import prisma


class ApiKeyRepository:
    """Repository handling database operations for ApiKey records."""

    async def get_by_id(self, api_key_id: str) -> Optional[ApiKey]:
        """Fetch an API key record by primary key."""
        return await prisma.apikey.find_unique(where={"id": api_key_id})

    async def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        """Fetch an API key record by its unique SHA-256 hash."""
        return await prisma.apikey.find_unique(where={"keyHash": key_hash})

    async def create(
        self,
        name: str,
        key_prefix: str,
        key_hash: str,
        scopes: list[str],
        project_id: str,
        created_by_id: str,
        expires_at: Optional[datetime] = None,
    ) -> ApiKey:
        """Create and persist a new hashed API key record."""
        return await prisma.apikey.create(
            data={
                "name": name,
                "keyPrefix": key_prefix,
                "keyHash": key_hash,
                "scopes": scopes,
                "projectId": project_id,
                "createdById": created_by_id,
                "expiresAt": expires_at,
            }
        )

    async def list_by_project(self, project_id: str) -> list[ApiKey]:
        """Fetch all API keys for a project, ordered by creation date descending."""
        return await prisma.apikey.find_many(
            where={"projectId": project_id},
            order={"createdAt": "desc"},
        )

    async def soft_revoke(
        self,
        api_key_id: str,
        revoked_at: datetime,
    ) -> ApiKey:
        """Soft-revoke an API key by setting its revokedAt timestamp."""
        return await prisma.apikey.update(
            where={"id": api_key_id},
            data={"revokedAt": revoked_at},
        )

    async def update_last_used(
        self,
        api_key_id: str,
        last_used_at: datetime,
    ) -> ApiKey:
        """Update the lastUsedAt activity timestamp for an API key."""
        return await prisma.apikey.update(
            where={"id": api_key_id},
            data={"lastUsedAt": last_used_at},
        )


api_key_repository = ApiKeyRepository()
