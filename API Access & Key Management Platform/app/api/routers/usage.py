"""
Protected API Data Router
=========================
Defines HTTP routes for protected consumer data access.
Protected by API key authentication and sliding window rate limiting.
Delegates request handling to UsageController.
"""

from fastapi import APIRouter, Depends

from app.controllers.usage_controller import usage_controller
from app.core.rate_limiter import require_rate_limit

router = APIRouter(
    prefix="/v1",
    tags=["Protected API"],
)


@router.get("/projects/{project_id}/data")
async def get_project_data(
    project_id: str,
    api_key=Depends(
        require_rate_limit(
            "data:read",
            max_requests=60,
            window_seconds=60,
        )
    ),
):
    """
    Sample protected resource endpoint demonstrating end-to-end API key enforcement.
    Requires 'data:read' scope and enforces rate limits.
    """
    return usage_controller.get_project_data(
        project_id=project_id,
        api_key=api_key,
    )
