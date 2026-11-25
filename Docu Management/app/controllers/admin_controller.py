"""
Admin Controller
================
Handles HTTP endpoints for platform administration.
"""

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_admin
from app.services.admin_service import admin_service
from app.schemas.admin import (
    AdminOverviewResponse,
    AdminActivityResponse,
    AdminUserListResponse,
    AdminUserRoleUpdate,
    AdminUserRoleResponse,
    AdminProjectListResponse,
    AdminOrganizationOption,
    AdminDocumentItem,
    AdminDocumentListResponse,
    AdminApiKeyItem,
    AdminApiKeyListResponse,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# -------------------------------------------------------------
# Overview
# -------------------------------------------------------------

@router.get(
    "/overview",
    response_model=AdminOverviewResponse,
)
async def get_admin_overview(
    admin=Depends(get_current_admin),
):
    """Retrieve platform-wide Admin dashboard statistics."""

    return await admin_service.get_overview()


@router.get(
    "/activity",
    response_model=AdminActivityResponse,
)
async def get_admin_activity(
    admin=Depends(get_current_admin),
):
    """Retrieve recent platform-wide activity."""

    return await admin_service.get_recent_activity()


# -------------------------------------------------------------
# User Management
# -------------------------------------------------------------

@router.get(
    "/users",
    response_model=AdminUserListResponse,
)
async def get_admin_users(
    search: str | None = Query(default=None, max_length=255),
    platform_role: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin=Depends(get_current_admin),
):
    """Retrieve platform users with search, filtering, and pagination."""

    return await admin_service.get_users(
        search=search,
        platform_role=platform_role,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserRoleResponse,
)
async def update_admin_user_role(
    user_id: str,
    payload: AdminUserRoleUpdate,
    admin=Depends(get_current_admin),
):
    """Update a user's platform role."""

    return await admin_service.update_user_role(
        user_id=user_id,
        platform_role=payload.platform_role,
        current_admin_id=admin.id,
    )


# -------------------------------------------------------------
# Platform Projects Management
# -------------------------------------------------------------

@router.get(
    "/projects",
    response_model=AdminProjectListResponse,
)
async def get_admin_projects(
    search: str | None = Query(default=None, max_length=100),
    organization_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin=Depends(get_current_admin),
):
    result = await admin_service.get_projects(
        search=search,
        organization_id=organization_id,
        page=page,
        page_size=page_size,
    )

    projects = []

    for project in result["projects"]:
        projects.append({
            "id": project.id,
            "name": project.name,
            "slug": project.slug,
            "organization_id": project.organizationId,
            "organization": {
                "id": project.organization.id,
                "name": project.organization.name,
            },
            "created_at": project.createdAt,
        })

    return {
        "projects": projects,
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
    }

# -------------------------------------------------------------
# Platform Organizations
# -------------------------------------------------------------

@router.get(
    "/organizations",
    response_model=list[AdminOrganizationOption],
)
async def get_admin_organizations(
    admin=Depends(get_current_admin),
):
    """Retrieve all organizations for platform administration."""

    organizations = await admin_service.get_all_organizations()

    return [
        {
            "id": organization.id,
            "name": organization.name,
        }
        for organization in organizations
    ]


# -------------------------------------------------------------
# Platform Documents Management
# -------------------------------------------------------------

@router.get(
    "/documents",
    response_model=AdminDocumentListResponse,
)
async def get_admin_documents(
    search: str | None = Query(default=None, max_length=255),
    organization_id: str | None = Query(default=None),
    project_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin=Depends(get_current_admin),
):
    result = await admin_service.get_documents(
        search=search,
        organization_id=organization_id,
        project_id=project_id,
        page=page,
        page_size=page_size,
    )

    documents = []

    for file in result["documents"]:
        documents.append({
            "id": file.id,
            "name": file.name,
            "original_name": file.originalName,
            "content_type": file.contentType,
            "size": file.size,
            "status": str(file.status),
            "current_version": file.currentVersion,
            "project_id": file.projectId,
            "project_name": file.project.name,
            "organization_id": file.project.organizationId,
            "organization_name": file.project.organization.name,
            "uploaded_by_id": file.uploadedById,
            "created_at": file.createdAt,
        })

    return {
        "documents": documents,
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
    }

# -------------------------------------------------------------
# Platform API Key Management
# -------------------------------------------------------------

@router.get(
    "/api-keys",
    response_model=AdminApiKeyListResponse,
)
async def get_admin_api_keys(
    search: str | None = Query(default=None, max_length=255),
    organization_id: str | None = Query(default=None),
    project_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin=Depends(get_current_admin),
):
    if status and status not in {"active", "revoked", "expired"}:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail="Invalid API key status filter",
        )

    result = await admin_service.get_api_keys(
        search=search,
        organization_id=organization_id,
        project_id=project_id,
        status=status,
        page=page,
        page_size=page_size,
    )

    now = datetime.now(timezone.utc)
    api_keys = []

    for key in result["api_keys"]:
        if key.revokedAt is not None:
            key_status = "revoked"
        elif key.expiresAt is not None and key.expiresAt <= now:
            key_status = "expired"
        else:
            key_status = "active"

        api_keys.append({
            "id": key.id,
            "name": key.name,
            "key_prefix": key.keyPrefix,
            "key_suffix": key.keySuffix,
            "scopes": key.scopes,
            "status": key_status,
            "expires_at": key.expiresAt,
            "last_used_at": key.lastUsedAt,
            "revoked_at": key.revokedAt,
            "created_at": key.createdAt,
            "project_id": key.projectId,
            "project_name": key.project.name,
            "organization_id": key.project.organizationId,
            "organization_name": key.project.organization.name,
            "created_by_id": key.createdById,
            "created_by_email": key.createdBy.email,
        })

    return {
        "api_keys": api_keys,
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
    }


@router.delete(
    "/api-keys/{api_key_id}",
    status_code=204,
)
async def revoke_admin_api_key(
    api_key_id: str,
    admin=Depends(get_current_admin),
):
    await admin_service.revoke_api_key(api_key_id)
    return None