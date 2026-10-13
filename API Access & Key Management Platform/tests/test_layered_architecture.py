"""
Layered Architecture Unit & Isolation Tests
===========================================
Validates the separation of concerns across Router, Controller, Service, and Repository layers.
Ensures that services can be tested with mocked repositories, controllers properly map domain
exceptions to HTTP exceptions, and routers route requests seamlessly.
"""

from datetime import datetime, timezone
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException

from app.services.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
    ValidationError,
)
from app.services.health_service import HealthService
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.api_key_service import ApiKeyService
from app.services.usage_service import UsageService
from app.services.analytics_service import AnalyticsService

from app.controllers.health_controller import HealthController
from app.controllers.organization_controller import OrganizationController
from app.controllers.project_controller import ProjectController
from app.controllers.api_key_controller import ApiKeyController
from app.controllers.usage_controller import UsageController
from app.controllers.analytics_controller import AnalyticsController

from app.schemas.organization import OrganizationCreate
from app.schemas.project import ProjectCreate
from app.schemas.api_key import ApiKeyCreate


# ==============================================================================
# Health Layer Tests
# ==============================================================================

def test_health_service_liveness():
    service = HealthService(repo=MagicMock())
    result = service.get_app_health()
    assert result["status"] == "healthy"
    assert "service" in result


@pytest.mark.asyncio
async def test_health_service_database_failure_raises_service_unavailable():
    mock_repo = MagicMock()
    mock_repo.ping_database = AsyncMock(side_effect=Exception("DB Down"))
    service = HealthService(repo=mock_repo)

    with pytest.raises(ServiceUnavailableError):
        await service.check_database_health()


@pytest.mark.asyncio
async def test_health_controller_translates_service_unavailable_to_503():
    mock_service = MagicMock()
    mock_service.check_database_health = AsyncMock(
        side_effect=ServiceUnavailableError({"status": "unhealthy", "database": "unavailable"})
    )
    controller = HealthController(service=mock_service)

    with pytest.raises(HTTPException) as exc_info:
        await controller.check_database()
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail["status"] == "unhealthy"


# ==============================================================================
# Organization Layer Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_organization_service_duplicate_slug_raises_conflict():
    mock_org_repo = MagicMock()
    mock_org_repo.get_by_slug = AsyncMock(return_value=MagicMock(id="org_1", slug="acme"))
    mock_membership_repo = MagicMock()

    service = OrganizationService(
        org_repo=mock_org_repo,
        membership_repo=mock_membership_repo,
    )

    with pytest.raises(ConflictError) as exc_info:
        await service.create_organization(
            data=OrganizationCreate(name="Acme Corp", slug="acme"),
            user_id="user_123",
        )
    assert "slug already exists" in str(exc_info.value)


@pytest.mark.asyncio
async def test_organization_controller_translates_conflict_to_409():
    mock_service = MagicMock()
    mock_service.create_organization = AsyncMock(
        side_effect=ConflictError("Organization slug already exists")
    )
    controller = OrganizationController(service=mock_service)

    with pytest.raises(HTTPException) as exc_info:
        await controller.create_organization(
            data=OrganizationCreate(name="Acme Corp", slug="acme"),
            user=MagicMock(id="user_123"),
        )
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Organization slug already exists"


# ==============================================================================
# Project Layer Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_project_service_unauthorized_role_raises_forbidden():
    mock_membership_repo = MagicMock()
    # User is VIEWER, which is not permitted to create projects
    mock_membership_repo.get_by_user_and_org = AsyncMock(
        return_value=MagicMock(role="VIEWER")
    )
    mock_project_repo = MagicMock()

    service = ProjectService(
        project_repo=mock_project_repo,
        membership_repo=mock_membership_repo,
    )

    with pytest.raises(ForbiddenError):
        await service.create_project(
            organization_id="org_1",
            data=ProjectCreate(name="New Project", slug="new-proj"),
            user_id="user_viewer",
        )


@pytest.mark.asyncio
async def test_project_controller_translates_not_found_to_404():
    mock_service = MagicMock()
    mock_service.create_project = AsyncMock(
        side_effect=NotFoundError("Organization not found")
    )
    controller = ProjectController(service=mock_service)

    with pytest.raises(HTTPException) as exc_info:
        await controller.create_project(
            organization_id="non_existent_org",
            data=ProjectCreate(name="Proj", slug="proj"),
            user=MagicMock(id="user_1"),
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Organization not found"


# ==============================================================================
# API Key Layer Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_api_key_service_rejects_duplicate_scopes():
    mock_membership_repo = MagicMock()
    mock_membership_repo.get_by_user_and_org = AsyncMock(
        return_value=MagicMock(role="OWNER")
    )
    mock_project_repo = MagicMock()
    mock_project_repo.get_by_id = AsyncMock(
        return_value=MagicMock(id="proj_1", organizationId="org_1")
    )
    mock_key_repo = MagicMock()

    service = ApiKeyService(
        api_key_repo=mock_key_repo,
        membership_repo=mock_membership_repo,
        project_repo=mock_project_repo,
    )

    with pytest.raises(ValidationError) as exc_info:
        await service.create_api_key(
            organization_id="org_1",
            project_id="proj_1",
            data=ApiKeyCreate(
                name="Key",
                scopes=["data:read", "data:read"],  # Duplicate scope
            ),
            user_id="user_1",
        )
    assert "Duplicate scopes" in str(exc_info.value)


@pytest.mark.asyncio
async def test_api_key_controller_translates_validation_to_422():
    mock_service = MagicMock()
    mock_service.create_api_key = AsyncMock(
        side_effect=ValidationError("Duplicate scopes are not allowed")
    )
    controller = ApiKeyController(service=mock_service)

    with pytest.raises(HTTPException) as exc_info:
        await controller.create_api_key(
            organization_id="org_1",
            project_id="proj_1",
            data=ApiKeyCreate(name="Key", scopes=["data:read"]),
            user=MagicMock(id="user_1"),
        )
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "Duplicate scopes are not allowed"


# ==============================================================================
# Usage & Analytics Layer Tests
# ==============================================================================

def test_usage_service_cross_project_isolation():
    service = UsageService()
    key_for_project_a = MagicMock(projectId="proj_A", name="Key A")

    with pytest.raises(ForbiddenError) as exc_info:
        service.get_project_data(
            project_id="proj_B",  # Accessing Project B with Project A's key
            api_key=key_for_project_a,
        )
    assert "cannot access this project" in str(exc_info.value)


@pytest.mark.asyncio
async def test_analytics_service_computes_correct_statistics():
    mock_req_repo = MagicMock()
    # 2 successful (200), 1 error (500)
    mock_logs = [
        MagicMock(statusCode=200, latencyMs=100),
        MagicMock(statusCode=200, latencyMs=200),
        MagicMock(statusCode=500, latencyMs=300),
    ]
    mock_req_repo.list_by_project_since = AsyncMock(return_value=mock_logs)

    mock_membership_repo = MagicMock()
    mock_membership_repo.get_by_user_and_org = AsyncMock(return_value=MagicMock())

    mock_project_repo = MagicMock()
    mock_project_repo.get_by_id = AsyncMock(
        return_value=MagicMock(id="proj_1", organizationId="org_1")
    )

    service = AnalyticsService(
        request_log_repo=mock_req_repo,
        membership_repo=mock_membership_repo,
        project_repo=mock_project_repo,
    )

    summary = await service.get_usage_summary(
        organization_id="org_1",
        project_id="proj_1",
        user_id="user_1",
        days=7,
    )

    assert summary.total_requests == 3
    assert summary.successful_requests == 2
    assert summary.error_requests == 1
    assert summary.average_latency_ms == 200.0
    assert summary.error_rate_percent == round(1 / 3 * 100, 2)
    assert summary.status_code_breakdown == {"200": 2, "500": 1}
