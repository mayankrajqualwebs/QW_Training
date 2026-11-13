
"""
Protected API Data Router
=========================
Defines real protected API routes and a separate API testing route.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.routing import APIRoute
from fastapi.responses import JSONResponse

from app.controllers.usage_controller import usage_controller
from app.core.rate_limiter import require_rate_limit


# --------------------------------------------------
# Existing protected API router
# --------------------------------------------------

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
    Actual protected API.
    Retains genuine HTTP 200, 401, 403 and 429 responses.
    """
    return usage_controller.get_project_data(
        project_id=project_id,
        api_key=api_key,
    )


# --------------------------------------------------
# API Test Console: HTTP exception normalization
# --------------------------------------------------

class ApiTestRoute(APIRoute):
    """
    Converts authentication and authorization failures
    into HTTP 200 responses, exclusively for API testing.
    """

    def get_route_handler(self):
        original_handler = super().get_route_handler()

        async def custom_handler(request: Request):
            try:
                return await original_handler(request)

            except HTTPException as exc:

                # Only normalize authentication/authorization errors
                if exc.status_code not in (401, 403):
                    raise

                result_status = (
                    "unauthorized"
                    if exc.status_code == 401
                    else "forbidden"
                )

                response = JSONResponse(
                    status_code=200,
                    content={
                        "success": False,
                        "status": result_status,
                        "message": str(exc.detail),
                        "data": None,
                    },
                )

                # Preserve the actual result for backend request logging
                response.headers["X-API-Test-Result"] = str(
                    exc.status_code
                )

                return response

        return custom_handler


# Separate router exclusively for Interactive API Test Console
api_test_router = APIRouter(
    prefix="/api-test",
    tags=["API Test Console"],
    route_class=ApiTestRoute,
)


@api_test_router.get("/projects/{project_id}/data")
async def test_project_data(
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
    Executes the same protected API logic,
    but normalizes HTTP 401 and 403 for the test console.
    """

    result = usage_controller.get_project_data(
        project_id=project_id,
        api_key=api_key,
    )

    return {
        "success": True,
        "status": "authorized",
        **result,
    }
