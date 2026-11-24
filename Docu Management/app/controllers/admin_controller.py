"""
Admin Controller
================
Handles HTTP endpoints for platform administration.
"""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_admin
from app.services.admin_service import admin_service
from app.schemas.admin import (
    AdminOverviewResponse,
    AdminActivityResponse,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


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
