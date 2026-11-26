"""
User API Key Service
====================
Provides business logic for the User API Access dashboard:
- Lists only API keys authorized for the authenticated user.
- Enforces strict user isolation: users cannot see or access keys assigned to others.
- Provides real telemetry analytics and usage summaries per key.
- Orchestrates secure, one-time reveal of assigned secrets.
- Allows authenticated users to safely revoke their own credentials.
"""

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException, status

from app.core.secret_delivery import (
    SecretAlreadyRevealedError,
    SecretDeliveryError,
    SecretDeliveryExpiredError,
    SecretDeliveryNotFoundError,
    secret_delivery_manager,
)
from app.db.client import prisma
from app.repositories.api_key_repository import (
    ApiKeyRepository,
    api_key_repository,
)
from app.schemas.user_api_key import (
    UserApiKeyDetailResponse,
    UserApiKeyItem,
    UserApiKeyRecentActivity,
    UserApiKeyRevealResponse,
)


def compute_key_status(key: Any) -> str:
    """Computes standard lifecycle status for an API key."""
    if key.revokedAt is not None:
        return "revoked"
    if key.expiresAt is not None:
        expires_at = key.expiresAt
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            return "expired"
    return "active"


def format_masked_key(prefix: str, suffix: Optional[str] = None) -> str:
    """Formats safe masked key identifier for UI presentation."""
    clean_suffix = suffix or ""
    return f"{prefix}••••••••{clean_suffix}"


class UserApiKeyService:
    """Service handling user-scoped API key operations and telemetry."""

    def __init__(self, api_key_repo: ApiKeyRepository = api_key_repository):
        self.api_key_repo = api_key_repo

    async def list_user_api_keys(
        self,
        user_id: str,
        search: Optional[str] = None,
        organization_id: Optional[str] = None,
        project_id: Optional[str] = None,
        key_status: Optional[str] = None,
    ) -> list[UserApiKeyItem]:
        """
        Lists only API keys where the authenticated user is the assigned creator/owner.
        Includes project and organization relationships for readable names.
        """
        where_filter: dict[str, Any] = {"createdById": user_id}

        if project_id:
            where_filter["projectId"] = project_id
        elif organization_id:
            where_filter["project"] = {"organizationId": organization_id}

        keys = await prisma.apikey.find_many(
            where=where_filter,
            include={"project": {"include": {"organization": True}}},
            order={"createdAt": "desc"},
        )

        results: list[UserApiKeyItem] = []
        now = datetime.now(timezone.utc)

        for key in keys:
            status_val = compute_key_status(key)
            if key_status and key_status != "all" and status_val != key_status:
                continue

            org_name = key.project.organization.name if key.project and key.project.organization else "Unknown Org"
            proj_name = key.project.name if key.project else "Unknown Project"

            # Apply search filter
            if search and search.strip():
                query = search.strip().lower()
                matches_name = query in key.name.lower()
                matches_prefix = query in key.keyPrefix.lower()
                matches_suffix = bool(key.keySuffix and query in key.keySuffix.lower())
                matches_org = query in org_name.lower()
                matches_proj = query in proj_name.lower()

                if not (matches_name or matches_prefix or matches_suffix or matches_org or matches_proj):
                    continue

            # Query real telemetry request counts from RequestLog
            total_requests = await prisma.requestlog.count(where={"apiKeyId": key.id})
            successful_requests = await prisma.requestlog.count(
                where={"apiKeyId": key.id, "statusCode": {"gte": 200, "lt": 400}}
            )
            failed_requests = await prisma.requestlog.count(
                where={"apiKeyId": key.id, "statusCode": {"gte": 400}}
            )

            # Check if one-time secret delivery packet is ready to reveal
            delivery_info = secret_delivery_manager.get_reveal_info(key.id, user_id)
            can_reveal = delivery_info["can_reveal"] if status_val == "active" else False

            results.append(
                UserApiKeyItem(
                    id=key.id,
                    name=key.name,
                    key_prefix=key.keyPrefix,
                    key_suffix=key.keySuffix,
                    masked_key=format_masked_key(key.keyPrefix, key.keySuffix),
                    organization_id=key.project.organizationId,
                    organization_name=org_name,
                    project_id=key.projectId,
                    project_name=proj_name,
                    assigned_date=key.createdAt,
                    created_date=key.createdAt,
                    expiry_date=key.expiresAt,
                    scopes=key.scopes,
                    last_used_date=key.lastUsedAt,
                    usage_count=total_requests,
                    successful_requests=successful_requests,
                    failed_requests=failed_requests,
                    status=status_val,
                    can_reveal=can_reveal,
                    reveal_expires_at=delivery_info.get("reveal_expires_at"),
                )
            )

        return results

    async def get_user_api_key_detail(
        self,
        api_key_id: str,
        user_id: str,
    ) -> UserApiKeyDetailResponse:
        """
        Retrieves full details and recent telemetry activity for an assigned API key.
        Raises 404 if the key does not exist or does not belong to the user.
        """
        key = await prisma.apikey.find_unique(
            where={"id": api_key_id},
            include={"project": {"include": {"organization": True}}},
        )

        if not key or key.createdById != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found or you are not authorized to view it.",
            )

        status_val = compute_key_status(key)
        org_name = key.project.organization.name if key.project and key.project.organization else "Unknown Org"
        proj_name = key.project.name if key.project else "Unknown Project"

        total_requests = await prisma.requestlog.count(where={"apiKeyId": key.id})
        successful_requests = await prisma.requestlog.count(
            where={"apiKeyId": key.id, "statusCode": {"gte": 200, "lt": 400}}
        )
        failed_requests = await prisma.requestlog.count(
            where={"apiKeyId": key.id, "statusCode": {"gte": 400}}
        )

        recent_logs = await prisma.requestlog.find_many(
            where={"apiKeyId": key.id},
            take=10,
            order={"createdAt": "desc"},
        )

        recent_activity = [
            UserApiKeyRecentActivity(
                id=log.id,
                method=log.method,
                path=log.path,
                status_code=log.statusCode,
                latency_ms=log.latencyMs,
                created_at=log.createdAt,
            )
            for log in recent_logs
        ]

        delivery_info = secret_delivery_manager.get_reveal_info(key.id, user_id)
        can_reveal = delivery_info["can_reveal"] if status_val == "active" else False

        return UserApiKeyDetailResponse(
            id=key.id,
            name=key.name,
            key_prefix=key.keyPrefix,
            key_suffix=key.keySuffix,
            masked_key=format_masked_key(key.keyPrefix, key.keySuffix),
            organization_id=key.project.organizationId,
            organization_name=org_name,
            project_id=key.projectId,
            project_name=proj_name,
            assigned_date=key.createdAt,
            created_date=key.createdAt,
            expiry_date=key.expiresAt,
            scopes=key.scopes,
            last_used_date=key.lastUsedAt,
            usage_count=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            status=status_val,
            can_reveal=can_reveal,
            reveal_expires_at=delivery_info.get("reveal_expires_at"),
            recent_activity=recent_activity,
        )

    async def reveal_user_api_key(
        self,
        api_key_id: str,
        user_id: str,
    ) -> UserApiKeyRevealResponse:
        """
        Executes one-time secure reveal and retrieval of an assigned raw secret.
        Enforces user ownership, key active status, and burning of the secret packet.
        """
        key = await prisma.apikey.find_unique(where={"id": api_key_id})
        if not key or key.createdById != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found or you are not authorized to access it.",
            )

        status_val = compute_key_status(key)
        if status_val == "revoked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reveal secrets for a revoked API key.",
            )
        if status_val == "expired":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reveal secrets for an expired API key.",
            )

        try:
            raw_secret = secret_delivery_manager.reveal_secret(
                api_key_id=api_key_id,
                user_id=user_id,
            )
        except SecretAlreadyRevealedError as exc:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=(
                    "This API key secret has already been revealed and can no longer be retrieved. "
                    "Contact your workspace administrator if credential rotation is required."
                ),
            ) from exc
        except SecretDeliveryExpiredError as exc:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=(
                    "The secure delivery window for this API key has expired. "
                    "Please ask your administrator to rotate or re-provision this credential."
                ),
            ) from exc
        except SecretDeliveryNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No pending secret delivery found for this API key. "
                    "The secret may have been provisioned prior to secure delivery or already discarded."
                ),
            ) from exc
        except SecretDeliveryError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt and securely deliver API key secret.",
            ) from exc

        return UserApiKeyRevealResponse(
            id=key.id,
            name=key.name,
            api_key=raw_secret,
            expires_at=key.expiresAt,
            revealed_at=datetime.now(timezone.utc),
        )

    async def revoke_user_api_key(
        self,
        api_key_id: str,
        user_id: str,
    ) -> None:
        """
        Allows an authorized user to immediately revoke their own API key.
        """
        key = await prisma.apikey.find_unique(where={"id": api_key_id})
        if not key or key.createdById != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found or you are not authorized to revoke it.",
            )

        if key.revokedAt is None:
            now = datetime.now(timezone.utc)
            await self.api_key_repo.soft_revoke(api_key_id=api_key_id, revoked_at=now)
            secret_delivery_manager.revoke_secret(api_key_id)


user_api_key_service = UserApiKeyService()
