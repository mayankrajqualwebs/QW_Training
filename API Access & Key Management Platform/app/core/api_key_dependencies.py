"""
API Key Authentication & Authorization Dependency
==================================================
Provides FastAPI dependency generators for securing developer-facing API endpoints.

Verification Flow:
1. Extracts the `X-API-Key` header from the incoming HTTP request.
2. Computes the SHA-256 hash of the supplied raw key.
3. Looks up the key record in PostgreSQL by `keyHash`.
4. Enforces security checks:
   - Key exists and is valid.
   - Key has not been revoked (`revokedAt is None`).
   - Key has not expired (`expiresAt > now`).
   - Key has been granted the required permission scope (e.g. `data:read`).
5. Updates `lastUsedAt` timestamp in Prisma to record key activity.
6. Returns the validated ApiKey model to the request handler.
"""

from datetime import datetime, timezone
from fastapi import Header, HTTPException, status

from app.core.security import hash_api_key
from app.repositories.api_key_repository import api_key_repository


def require_api_key(required_scope: str):
    """
    Factory function that produces a FastAPI dependency enforcing API key authentication
    and specific scope authorization.

    Args:
        required_scope: The permission string required to access the endpoint (e.g., 'data:read').

    Returns:
        An async dependency callable that inspects the request and returns the validated ApiKey.
    """

    async def api_key_auth(
        x_api_key: str | None = Header(
            default=None,
            alias="X-API-Key",
        ),
    ):
        # 1. Require header presence
        if not x_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key is required",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # 2. Hash raw key and look up record in database
        key_hash = hash_api_key(x_api_key)

        api_key = await api_key_repository.get_by_hash(key_hash)

        if api_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
            )

        # 3. Check revocation status
        if api_key.revokedAt is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has been revoked",
            )

        # 4. Check expiration timestamp
        expires_at = api_key.expiresAt
        if expires_at is not None:
            # Ensure timezone-aware comparison
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(
                    tzinfo=timezone.utc
                )

            if expires_at <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key has expired",
                )

        # 5. Check permission scope
        if required_scope not in api_key.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API key does not have the required scope",
            )

        # 6. Record key telemetry (lastUsedAt) for audit and activity tracking
        await api_key_repository.update_last_used(
            api_key_id=api_key.id,
            last_used_at=datetime.now(timezone.utc),
        )

        return api_key

    return api_key_auth
