
"""
Protected API Data Router
=========================
Defines real protected API routes and a separate API testing route.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.routing import APIRoute
from fastapi.responses import JSONResponse

from app.controllers.usage_controller import usage_controller
from app.core.rate_limiter import require_rate_limit
from app.core.security import hash_api_key
from app.repositories.api_key_repository import api_key_repository


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
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    api_key: str | None = Query(default=None),
    key_id: str | None = Query(default=None),
):
    """
    Executes protected API logic for the test console.
    Accepts API key ID or raw API key secret, converts and checks hash in DB,
    and returns exact failure causes (incorrect, revoked, different project, expired, or missing scope).
    """
    key_input = (x_api_key or api_key or key_id or "").strip()
    if not key_input:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key ID or secret is required",
        )

    # 1. Check ID in DB first
    key_record = await api_key_repository.get_by_id(key_input)

    # 2. If not found by ID, convert hash of input and check by hash
    if key_record is None:
        key_hash = hash_api_key(key_input)
        key_record = await api_key_repository.get_by_hash(key_hash)

    # 3. Cause of failure: Incorrect API key (not found in database)
    if key_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect API key: Key not found in database",
        )

    # 4. Cause of failure: Belongs to different project
    if key_record.projectId != project_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key belongs to a different project",
        )

    # 5. Cause of failure: Revoked
    if key_record.revokedAt is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has been revoked",
        )

    # 6. Cause of failure: Expired
    expires_at = key_record.expiresAt
    if expires_at is not None:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired",
            )

    # 7. Cause of failure: Missing required scope
    if "data:read" not in key_record.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key does not have the required scope ('data:read')",
        )

    # All checks passed: Update lastUsedAt activity timestamp
    await api_key_repository.update_last_used(
        api_key_id=key_record.id,
        last_used_at=datetime.now(timezone.utc),
    )

    result = usage_controller.get_project_data(
        project_id=project_id,
        api_key=key_record,
    )

    return {
        "success": True,
        "status": "authorized",
        **result,
    }
