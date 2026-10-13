"""
API Key Data Schemas
====================
Defines Pydantic request and response models for provisioning and listing API keys.

Security Design:
- `ApiKeyCreate`: Accepts the desired key name, requested scopes, and optional expiration.
- `ApiKeyCreatedResponse`: Returned ONLY ONCE immediately upon key generation. Includes the
  plaintext `api_key` secret so the developer can copy it.
- `ApiKeyResponse`: Used when listing existing keys. Does NOT contain the plaintext secret or
  the secret hash. Only exposes the safe `key_prefix` (e.g., ak_live_3vK...) for identification.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    """Payload received when provisioning a new API key."""
    name: str = Field(
        min_length=2,
        max_length=100,
        description="Friendly name describing the purpose of the key (e.g. CI/CD Pipeline).",
    )
    scopes: list[str] = Field(
        min_length=1,
        max_length=5,
        description="Allowed permission scopes (e.g. ['data:read', 'data:write']).",
    )
    expires_at: datetime | None = Field(
        default=None,
        description="Optional future timestamp when the key automatically expires.",
    )


class ApiKeyCreatedResponse(BaseModel):
    """
    Response returned ONLY ONCE immediately after key creation.
    Contains the raw `api_key` secret string before it is discarded from server memory.
    """
    id: str
    name: str
    key_prefix: str
    api_key: str  # The full plaintext secret (only exposed at creation time)
    scopes: list[str]
    expires_at: datetime | None
    last_used_at: datetime | None = None
    revoked_at: datetime | None = None
    created_at: datetime


class ApiKeyResponse(BaseModel):
    """
    Safe representation for listing or inspecting existing API keys.
    Plaintext secrets are omitted to prevent credential exposure.
    """
    id: str
    name: str
    key_prefix: str  # Only the public prefix (e.g. ak_live_1234...) is displayed
    scopes: list[str]
    expires_at: datetime | None
    last_used_at: datetime | None
    revoked_at: datetime | None
    created_at: datetime
