"""
Analytics API Router
====================
Defines HTTP routes for querying project usage telemetry and metrics summaries.
Delegates request execution to AnalyticsController.
"""

from fastapi import APIRouter, Depends, Query

from app.controllers.analytics_controller import analytics_controller
from app.core.dependencies import get_current_user
from app.schemas.analytics import UsageSummary

router = APIRouter(
    prefix="/organizations/{organization_id}/projects/{project_id}/analytics",
    tags=["Analytics"],
)


@router.get(
    "/summary",
    response_model=UsageSummary,
)
async def get_usage_summary(
    organization_id: str,
    project_id: str,
    days: int = Query(default=7, ge=1, le=30),
    user=Depends(get_current_user),
):
    """
    Computes aggregated API usage metrics for a project over a specified time window.
    """
    return await analytics_controller.get_usage_summary(
        organization_id=organization_id,
        project_id=project_id,
        days=days,
        user=user,
    )
