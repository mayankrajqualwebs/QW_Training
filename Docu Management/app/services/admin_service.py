
"""
Admin Service
=============
Coordinates platform-wide administrative statistics
and recent activity for the Admin Console.
"""

import asyncio
from fastapi import HTTPException
from app.repositories.admin_repository import admin_repository
from app.repositories.project_repository import project_repository

class AdminService:
    """Service for Admin Console dashboard operations."""

    async def get_overview(self) -> dict:
        """
        Retrieve platform-wide dashboard statistics.
        """

        (
            total_users,
            total_organizations,
            total_projects,
            total_documents,
            uploaded_documents,
            active_api_keys,
            total_api_requests,
        ) = await self._get_overview_counts()

        return {
            "total_users": total_users,
            "total_organizations": total_organizations,
            "total_projects": total_projects,
            "total_documents": total_documents,
            "uploaded_documents": uploaded_documents,
            "active_api_keys": active_api_keys,
            "total_api_requests": total_api_requests,
        }

    async def _get_overview_counts(self):
        """Fetch dashboard counts concurrently."""

        import asyncio

        return await asyncio.gather(
            admin_repository.count_users(),
            admin_repository.count_organizations(),
            admin_repository.count_projects(),
            admin_repository.count_documents(),
            admin_repository.count_uploaded_documents(),
            admin_repository.count_active_api_keys(),
            admin_repository.count_api_requests(),
        )

    
    async def get_recent_activity(self) -> dict:
        """
        Retrieve recent platform activity across users,
        documents, and protected API requests.
        """

        import asyncio

        recent_users, recent_documents, recent_requests = (
            await asyncio.gather(
                admin_repository.get_recent_users(limit=5),
                admin_repository.get_recent_documents(limit=5),
                admin_repository.get_recent_requests(limit=10),
            )
        )

        return {
            "recent_users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "created_at": user.createdAt,
                }
                for user in recent_users
            ],

            "recent_documents": [
                {
                    "id": document.id,
                    "name": document.name,
                    "original_name": document.originalName,
                    "content_type": document.contentType,
                    "size": int(document.size),
                    "created_at": document.createdAt,
                    "project_name": document.project.name,
                    "uploaded_by_email": document.uploadedBy.email,
                }
                for document in recent_documents
            ],

            "recent_requests": [
                {
                    "id": request.id,
                    "method": request.method,
                    "path": request.path,
                    "status_code": request.statusCode,
                    "latency_ms": request.latencyMs,
                    "created_at": request.createdAt,
                    "project_name": request.project.name,
                }
                for request in recent_requests
            ],
        }


    # -------------------------------------------------------------
    # User Management
    # -------------------------------------------------------------

    async def get_users(
        self,
        search: str | None = None,
        platform_role: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """Retrieve users with search, role filtering, and pagination."""
       
        
        if platform_role:
            platform_role = platform_role.upper()

            if platform_role not in {"USER", "ADMIN"}:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid platform role filter",
                )


        skip = (page - 1) * page_size

        users, total = await asyncio.gather(
            admin_repository.list_users(
                search=search,
                platform_role=platform_role,
                skip=skip,
                take=page_size,
            ),
            admin_repository.count_filtered_users(
                search=search,
                platform_role=platform_role,
            ),
        )

        return {
            "users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "platform_role": (
                        user.platformRole.value
                        if hasattr(user.platformRole, "value")
                        else user.platformRole
                    ),
                    "created_at": user.createdAt,
                }
                for user in users
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def update_user_role(
        self,
        user_id: str,
        platform_role: str,
        current_admin_id: str,
    ) -> dict:
        """Update a user's platform role with admin safeguards."""

        platform_role = platform_role.upper()

        if platform_role not in {"USER", "ADMIN"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid platform role",
            )

        user = await admin_repository.get_user_by_id(user_id)

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        current_role = (
            user.platformRole.value
            if hasattr(user.platformRole, "value")
            else user.platformRole
        )

        # No update is necessary.
        if current_role == platform_role:
            return {
                "id": user.id,
                "email": user.email,
                "platform_role": current_role,
            }

        # Prevent an administrator from removing their own admin access.
        if (
            user.id == current_admin_id
            and current_role == "ADMIN"
            and platform_role == "USER"
        ):
            raise HTTPException(
                status_code=400,
                detail="You cannot remove your own admin role",
            )

        # Prevent the platform from having zero administrators.
        if current_role == "ADMIN" and platform_role == "USER":
            admin_count = await admin_repository.count_admins()

            if admin_count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot demote the last remaining administrator",
                )

        updated_user = await admin_repository.update_user_role(
            user_id=user_id,
            platform_role=platform_role,
        )

        updated_role = (
            updated_user.platformRole.value
            if hasattr(updated_user.platformRole, "value")
            else updated_user.platformRole
        )

        return {
            "id": updated_user.id,
            "email": updated_user.email,
            "platform_role": updated_role,
        }

    
    # -----------------------------------------------------------------
    # Admin Project Management
    # -----------------------------------------------------------------

    async def get_projects(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """Return a paginated, platform-wide project listing."""

        skip = (page - 1) * page_size

        projects = await project_repository.list_all_projects(
            search=search,
            organization_id=organization_id,
            skip=skip,
            take=page_size,
        )

        total = await project_repository.count_all_projects(
            search=search,
            organization_id=organization_id,
        )

        return {
            "projects": projects,
            "total": total,
            "page": page,
            "page_size": page_size,
        }





admin_service = AdminService()
