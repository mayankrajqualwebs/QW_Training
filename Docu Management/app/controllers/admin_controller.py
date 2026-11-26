"""
Admin Controller
================
Handles HTTP endpoints for platform administration.
"""

from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from datetime import datetime, timezone

from app.core.dependencies import get_current_admin
from app.services.admin_service import admin_service
from app.schemas.admin import (
    AdminOverviewResponse,
    AdminActivityResponse,
    AdminUserItem,
    AdminUserListResponse,
    AdminUserCreateRequest,
    AdminUserRoleUpdate,
    AdminUserRoleResponse,
    AdminProjectItem,
    AdminProjectListResponse,
    AdminProjectCreateRequest,
    AdminOrganizationOption,
    AdminOrganizationCreateRequest,
    AdminDocumentItem,
    AdminDocumentListResponse,
    AdminDocumentDetailResponse,
    AdminDocumentUpdateRequest,
    AdminDocumentDownloadResponse,
    AdminApiKeyItem,
    AdminApiKeyListResponse,
    AdminMonitoringSummary,
    AdminMonitoringRequestListResponse,
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


@router.post(
    "/users",
    response_model=AdminUserItem,
    status_code=201,
)
async def create_admin_user(
    payload: AdminUserCreateRequest,
    admin=Depends(get_current_admin),
):
    """Create a new platform user."""

    return await admin_service.create_user(
        email=str(payload.email),
        password=payload.password,
        platform_role=payload.platform_role,
    )


@router.delete(
    "/users/{user_id}",
    status_code=204,
)
async def delete_admin_user(
    user_id: str,
    admin=Depends(get_current_admin),
):
    """Delete a platform user."""

    await admin_service.delete_user(
        user_id=user_id,
        current_admin_id=admin.id,
    )
    return None


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


@router.post(
    "/projects",
    response_model=AdminProjectItem,
    status_code=201,
)
async def create_admin_project(
    payload: AdminProjectCreateRequest,
    admin=Depends(get_current_admin),
):
    """Create a new project scoped to an organization."""
    return await admin_service.create_project(
        organization_id=payload.organization_id,
        name=payload.name,
        slug=payload.slug,
    )


@router.delete(
    "/projects/{project_id}",
    status_code=204,
)
async def delete_admin_project(
    project_id: str,
    admin=Depends(get_current_admin),
):
    """Delete a project."""
    await admin_service.delete_project(project_id=project_id)
    return None

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
            "slug": organization.slug,
        }
        for organization in organizations
    ]


@router.post(
    "/organizations",
    response_model=AdminOrganizationOption,
    status_code=201,
)
async def create_admin_organization(
    payload: AdminOrganizationCreateRequest,
    admin=Depends(get_current_admin),
):
    """Create a new organization workspace."""
    return await admin_service.create_organization(
        name=payload.name,
        slug=payload.slug,
        current_admin_id=admin.id,
    )


@router.delete(
    "/organizations/{organization_id}",
    status_code=204,
)
async def delete_admin_organization(
    organization_id: str,
    admin=Depends(get_current_admin),
):
    """Delete an organization workspace."""
    await admin_service.delete_organization(organization_id=organization_id)
    return None


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
            "status": str(file.status.value if hasattr(file.status, "value") else file.status),
            "current_version": file.currentVersion,
            "project_id": file.projectId,
            "project_name": file.project.name,
            "organization_id": file.project.organizationId,
            "organization_name": file.project.organization.name,
            "uploaded_by_id": file.uploadedById,
            "uploaded_by_email": getattr(getattr(file, "uploadedBy", None), "email", None),
            "created_at": file.createdAt,
        })

    return {
        "documents": documents,
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
    }


@router.post(
    "/documents/upload",
    response_model=AdminDocumentDetailResponse,
    status_code=201,
)
async def upload_admin_document(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    name: str | None = Form(default=None),
    admin=Depends(get_current_admin),
):
    """Direct document upload to a project from Admin Console."""
    return await admin_service.upload_document(
        file=file,
        project_id=project_id,
        name=name,
        current_admin_id=admin.id,
    )


@router.get(
    "/documents/{document_id}",
    response_model=AdminDocumentDetailResponse,
)
async def get_admin_document_details(
    document_id: str,
    admin=Depends(get_current_admin),
):
    """Retrieve full metadata, uploader, and version history for a document."""
    return await admin_service.get_document_details(document_id=document_id)


@router.patch(
    "/documents/{document_id}",
    response_model=AdminDocumentDetailResponse,
)
async def update_admin_document(
    document_id: str,
    payload: AdminDocumentUpdateRequest,
    admin=Depends(get_current_admin),
):
    """Update document metadata (display name)."""
    return await admin_service.update_document_metadata(
        document_id=document_id,
        name=payload.name,
    )


@router.get(
    "/documents/{document_id}/download",
    response_model=AdminDocumentDownloadResponse,
)
async def download_admin_document(
    document_id: str,
    admin=Depends(get_current_admin),
):
    """Generate temporary presigned S3 download URL for a document."""
    return await admin_service.get_document_download(document_id=document_id)


@router.delete(
    "/documents/{document_id}",
    status_code=204,
)
async def delete_admin_document(
    document_id: str,
    admin=Depends(get_current_admin),
):
    """Permanently delete a document and its storage objects."""
    await admin_service.delete_document(document_id=document_id)
    return None

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


# -------------------------------------------------------------
# Platform API Monitoring
# -------------------------------------------------------------

@router.get(
    "/monitoring/summary",
    response_model=AdminMonitoringSummary,
)
async def get_admin_monitoring_summary(
    days: int = Query(default=7, ge=1, le=30),
    admin=Depends(get_current_admin),
):
    return await admin_service.get_monitoring_summary(
        days=days,
    )


@router.get(
    "/monitoring/requests",
    response_model=AdminMonitoringRequestListResponse,
)
async def get_admin_monitoring_requests(
    search: str | None = Query(
        default=None,
        max_length=255,
    ),
    organization_id: str | None = Query(default=None),
    project_id: str | None = Query(default=None),
    method: str | None = Query(default=None),
    status_category: str | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=30),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    admin=Depends(get_current_admin),
):
    result = await admin_service.get_monitoring_requests(
        search=search,
        organization_id=organization_id,
        project_id=project_id,
        method=method,
        status_category=status_category,
        days=days,
        page=page,
        page_size=page_size,
    )

    requests = []

    for log in result["requests"]:
        requests.append({
            "id": log.id,
            "method": log.method,
            "path": log.path,
            "status_code": log.statusCode,
            "latency_ms": log.latencyMs,
            "created_at": log.createdAt,
            "project_id": log.projectId,
            "project_name": log.project.name,
            "organization_id": log.project.organizationId,
            "organization_name": log.project.organization.name,
            "api_key_id": log.apiKeyId,
            "api_key_name": (
                log.apiKey.name
                if log.apiKey
                else None
            ),
            "api_key_prefix": (
                log.apiKey.keyPrefix
                if log.apiKey
                else None
            ),
        })

    return {
        "requests": requests,
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
    }
