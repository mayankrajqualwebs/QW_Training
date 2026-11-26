"""
User API Key Schemas
====================
Pydantic models for user-facing API key inventory, detailed telemetry inspection,
and secure one-time secret delivery.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserApiKeyItem(BaseModel):
    """
    Representation of an API key assigned to the authenticated user.
    Plaintext secrets are omitted.
    """
    id: str
    name: str
    key_prefix: str
    key_suffix: Optional[str] = None
    masked_key: str = Field(
        description="Public display format, e.g. ak_live_3vK••••••••e2a",
    )
    organization_id: str
    organization_name: str
    project_id: str
    project_name: str
    assigned_date: datetime
    created_date: datetime
    expiry_date: Optional[datetime] = None
    scopes: list[str]
    last_used_date: Optional[datetime] = None
    usage_count: int = Field(default=0, description="Total API requests made with this key")
    successful_requests: int = Field(default=0, description="Requests with 2xx/3xx status")
    failed_requests: int = Field(default=0, description="Requests with 4xx/5xx status")
    status: str = Field(description="active, expired, or revoked")
    can_reveal: bool = Field(
        default=False,
        description="Whether a one-time secure secret delivery packet is pending for reveal",
    )
    reveal_expires_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the secret delivery package expires if unrevealed",
    )


class UserApiKeyRecentActivity(BaseModel):
    """Telemetry log entry for recent API key usage."""
    id: str
    method: str
    path: str
    status_code: int
    latency_ms: int
    created_at: datetime


class UserApiKeyDetailResponse(UserApiKeyItem):
    """
    Full inspection model including recent telemetry activity for the assigned key.
    """
    recent_activity: list[UserApiKeyRecentActivity] = Field(default_factory=list)


class UserApiKeyRevealResponse(BaseModel):
    """
    Response returned ONLY ONCE when the user explicitly reveals their secret.
    """
    id: str
    name: str
    api_key: str  # Raw plaintext secret string
    expires_at: Optional[datetime] = None
    revealed_at: datetime
