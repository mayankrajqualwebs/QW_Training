"""
Main Application Entrypoint
===========================
Configures and launches the FastAPI backend service for the API Access & Key Management Platform.

Architecture Overview:
- Lifespan: Manages asynchronous Prisma PostgreSQL database connections on startup and shutdown.
- Logging Middleware: Intercepts `/v1/projects/{id}/data` requests to record audit and latency telemetry
  in the `RequestLog` table without blocking or impacting API responses.
- CORS Middleware: Allows cross-origin requests from local frontend development environments.
- Router Registration: Mounts modular API routers for health, authentication, organizations, projects,
  API keys, usage, and analytics.
"""

import re
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    analytics_router,
    api_keys_router,
    auth_router,
    health_router,
    organizations_router,
    projects_router,
    usage_router,
)
from app.core.config import settings
from app.core.security import hash_api_key
from app.db.client import prisma
from app.repositories.api_key_repository import api_key_repository
from app.repositories.project_repository import project_repository
from app.repositories.request_log_repository import request_log_repository


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database connection pool before accepting requests,
    and cleanly disconnects on application shutdown.
    """
    # Connect once when the application starts
    await prisma.connect()

    try:
        yield
    finally:
        # Close the database connection pool on shutdown
        await prisma.disconnect()


# Instantiate FastAPI application with metadata and lifespan
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    description=(
        "A developer platform for API key management, "
        "access control, and usage monitoring."
    ),
    lifespan=lifespan,
)


@app.get("/", tags=["Root"])
async def root():
    """Root status endpoint returning service metadata and documentation link."""
    return {
        "message": "API Access & Key Management Platform is running",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.middleware("http")
async def log_api_requests(request, call_next):
    """
    Telemetry and Request Logging Middleware.
    
    Responsibilities:
    1. Times request execution with high-resolution monotonic timer (`perf_counter`).
    2. Lets the request proceed to the matched route handler via `call_next(request)`.
    3. In the `finally` block, checks if the path matches the protected data API pattern.
    4. If matched, resolves the caller's API key ID (by hashing the `X-API-Key` header)
       and records an entry in the `RequestLog` table.
    5. Gracefully handles any logging errors to ensure the client response is never corrupted.
    """
    started_at = time.perf_counter()
    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code
        return response

    finally:
        path = request.url.path

        # Match only the protected API route family: /v1/projects/{project_id}/data
        match = re.fullmatch(
            r"/v1/projects/([^/]+)/data/?",
            path,
        )

        if match:
            project_id = match.group(1)
            api_key_id = None

            try:
                # RequestLog requires a valid project foreign key
                project = await project_repository.get_by_id(project_id)

                if project is not None:
                    raw_key = request.headers.get("X-API-Key")

                    # Look up the API key ID by its hash (never store the raw key)
                    if raw_key:
                        key = await api_key_repository.get_by_hash(
                            hash_api_key(raw_key)
                        )

                        # Associate only if the key belongs to this project
                        if (
                            key is not None
                            and key.projectId == project_id
                        ):
                            api_key_id = key.id

                    latency_ms = int(
                        (time.perf_counter() - started_at) * 1000
                    )

                    # Persist the request log for analytics and monitoring
                    await request_log_repository.create(
                        project_id=project_id,
                        api_key_id=api_key_id,
                        method=request.method,
                        path=path,
                        status_code=status_code,
                        latency_ms=latency_ms,
                        ip_address=(
                            request.client.host
                            if request.client
                            else None
                        ),
                    )

            except Exception:
                # Logging failures must never break the client response
                pass


# Cross-Origin Resource Sharing (CORS) Middleware
# Permits frontend applications running on local dev ports to connect seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount feature routers
app.include_router(health_router)          # /health, /health/database
app.include_router(auth_router)            # /auth/register, /auth/login, /auth/refresh, /auth/me
app.include_router(organizations_router)   # /organizations
app.include_router(projects_router)        # /organizations/{org_id}/projects
app.include_router(api_keys_router)        # /organizations/{org_id}/projects/{proj_id}/api-keys
app.include_router(usage_router)           # /v1/projects/{proj_id}/data
app.include_router(analytics_router)       # /organizations/{org_id}/projects/{proj_id}/analytics/summary
