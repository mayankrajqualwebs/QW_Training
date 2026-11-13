
import pytest
from pydantic import ValidationError

from app.schemas.auth import RegisterRequest
from app.schemas.organization import OrganizationCreate
from app.schemas.project import ProjectCreate
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse
from datetime import datetime, timezone


def test_registration_accepts_valid_email_and_password():
    data = RegisterRequest(
        email="developer@example.com",
        password="SecurePassword!123",
    )

    assert str(data.email) == "developer@example.com"


def test_registration_rejects_short_password():
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="developer@example.com",
            password="short",
        )


def test_organization_slug_must_be_valid():
    OrganizationCreate(
        name="Development Team",
        slug="development-team",
    )

    with pytest.raises(ValidationError):
        OrganizationCreate(
            name="Development Team",
            slug="Development Team",
        )


def test_project_slug_must_be_valid():
    ProjectCreate(
        name="Backend API",
        slug="backend-api",
    )

    with pytest.raises(ValidationError):
        ProjectCreate(
            name="Backend API",
            slug="Backend API",
        )


def test_api_key_requires_at_least_one_scope():
    ApiKeyCreate(
        name="Development Key",
        scopes=["data:read"],
    )

    with pytest.raises(ValidationError):
        ApiKeyCreate(
            name="Development Key",
            scopes=[],
        )


def test_api_key_response_schemas_support_key_suffix():
    now = datetime.now(timezone.utc)
    res = ApiKeyResponse(
        id="key_1",
        name="Test Key",
        key_prefix="ak_live_p3Bg5",
        key_suffix="e2a",
        scopes=["data:read"],
        expires_at=None,
        last_used_at=None,
        revoked_at=None,
        created_at=now,
    )
    assert res.key_prefix == "ak_live_p3Bg5"
    assert res.key_suffix == "e2a"

    created = ApiKeyCreatedResponse(
        id="key_1",
        name="Test Key",
        key_prefix="ak_live_p3Bg5",
        key_suffix="e2a",
        api_key="ak_live_p3Bg5xxxxxxxxxxxxxxxe2a",
        scopes=["data:read"],
        expires_at=None,
        created_at=now,
    )
    assert created.key_prefix == "ak_live_p3Bg5"
    assert created.key_suffix == "e2a"
