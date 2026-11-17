"""
Refresh Token Repository
========================
Handles database queries and persistence for RefreshToken records.
"""

from datetime import datetime
from typing import Optional
from prisma.models import RefreshToken
from app.db.client import prisma


class RefreshTokenRepository:
    """Repository handling database operations for RefreshToken records."""

    async def create(
        self,
        token_hash: str,
        user_id: str,
        expires_at: datetime,
    ) -> RefreshToken:
        """Store a new hashed refresh token for a user."""
        return await prisma.refreshtoken.create(
            data={
                "tokenHash": token_hash,
                "userId": user_id,
                "expiresAt": expires_at,
            }
        )

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Fetch a refresh token record by its unique SHA-256 hash."""
        return await prisma.refreshtoken.find_unique(
            where={"tokenHash": token_hash}
        )

    async def revoke(
        self,
        token_id: str,
        revoked_at: datetime,
    ) -> RefreshToken:
        """Mark a refresh token record as revoked."""
        return await prisma.refreshtoken.update(
            where={"id": token_id},
            data={"revokedAt": revoked_at},
        )


refresh_token_repository = RefreshTokenRepository()
