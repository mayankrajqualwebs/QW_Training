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
