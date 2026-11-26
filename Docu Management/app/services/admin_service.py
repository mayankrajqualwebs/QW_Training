
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
from app.repositories.organization_repository import organization_repository
from app.repositories.file_repository import file_repository

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

    async def create_user(
        self,
        email: str,
        password: str,
        platform_role: str = "USER",
    ) -> dict:
        """Create a new platform user with administrative role assignment."""
        from app.core.security import hash_password

        email = str(email).lower().strip()
        platform_role = str(platform_role).upper().strip()

        if platform_role not in {"USER", "ADMIN"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid platform role. Must be 'USER' or 'ADMIN'.",
            )

        existing = await admin_repository.get_user_by_email(email)
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists",
            )

        user = await admin_repository.create_user(
            email=email,
            password_hash=hash_password(password),
            platform_role=platform_role,
        )

        role = (
            user.platformRole.value
            if hasattr(user.platformRole, "value")
            else user.platformRole
        )

        return {
            "id": user.id,
            "email": user.email,
            "platform_role": role,
            "created_at": user.createdAt,
        }

    async def delete_user(
        self,
        user_id: str,
        current_admin_id: str,
    ) -> None:
        """Delete a platform user with administrative safeguards and relationship integrity checks."""
        if user_id == current_admin_id:
            raise HTTPException(
                status_code=400,
                detail="You cannot delete your own administrator account.",
            )

        user = await admin_repository.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        current_role = (
            user.platformRole.value
            if hasattr(user.platformRole, "value")
            else user.platformRole
        )

        # Prevent deleting the last remaining administrator
        if current_role == "ADMIN":
            admin_count = await admin_repository.count_admins()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete the last remaining platform administrator.",
                )

        # Check relationships protected by onDelete: Restrict
        org_count = await admin_repository.count_user_created_organizations(user_id)
        if org_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete user who is the creator of {org_count} organization(s). Reassign or delete those organizations first.",
            )

        api_key_count = await admin_repository.count_user_created_api_keys(user_id)
        if api_key_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete user who created {api_key_count} active API key(s). Revoke or delete those API keys first.",
            )

        file_count = await admin_repository.count_user_uploaded_files(user_id)
        if file_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete user who uploaded {file_count} document(s). Remove their documents first.",
            )

        version_count = await admin_repository.count_user_uploaded_file_versions(user_id)
        if version_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete user who uploaded {version_count} document version(s). Remove their document versions first.",
            )

        try:
            await admin_repository.delete_user(user_id)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="Unable to delete user due to associated records.",
            ) from exc

    
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
    
    async def get_all_organizations(self):
        return await organization_repository.list_all_organizations()

    async def create_organization(
        self,
        name: str,
        slug: str,
        current_admin_id: str,
    ) -> dict:
        """Create a new organization workspace from Admin Console."""
        name = name.strip()
        slug = slug.lower().strip()

        if len(name) < 2 or len(name) > 100:
            raise HTTPException(
                status_code=400,
                detail="Organization name must be between 2 and 100 characters.",
            )

        existing = await admin_repository.get_organization_by_slug(slug)
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail=f"An organization with the slug '{slug}' already exists.",
            )

        org = await admin_repository.create_organization(
            name=name,
            slug=slug,
            creator_id=current_admin_id,
        )

        return {
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
        }

    async def delete_organization(
        self,
        organization_id: str,
    ) -> None:
        """Delete an organization with relationship integrity checks."""
        org = await admin_repository.get_organization_by_id(organization_id)
        if org is None:
            raise HTTPException(
                status_code=404,
                detail="Organization not found.",
            )

        project_count = await admin_repository.count_organization_projects(organization_id)
        if project_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete organization '{org.name}' because it contains {project_count} associated project(s). Please delete all projects within this organization first.",
            )

        try:
            await admin_repository.delete_organization(organization_id)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="Unable to delete organization due to associated records.",
            ) from exc

    async def create_project(
        self,
        organization_id: str,
        name: str,
        slug: str,
    ) -> dict:
        """Create a new project scoped to an organization from Admin Console."""
        name = name.strip()
        slug = slug.lower().strip()

        if len(name) < 2 or len(name) > 100:
            raise HTTPException(
                status_code=400,
                detail="Project name must be between 2 and 100 characters.",
            )

        org = await admin_repository.get_organization_by_id(organization_id)
        if org is None:
            raise HTTPException(
                status_code=404,
                detail="Selected organization not found.",
            )

        existing = await admin_repository.get_project_by_org_and_slug(
            organization_id=organization_id,
            slug=slug,
        )
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail=f"A project with the slug '{slug}' already exists in organization '{org.name}'.",
            )

        project = await admin_repository.create_project(
            organization_id=organization_id,
            name=name,
            slug=slug,
        )

        return {
            "id": project.id,
            "name": project.name,
            "slug": project.slug,
            "organization_id": project.organizationId,
            "organization": {
                "id": project.organization.id,
                "name": project.organization.name,
            },
            "created_at": project.createdAt,
        }

    async def delete_project(
        self,
        project_id: str,
    ) -> None:
        """Delete a project with relationship integrity checks."""
        project = await admin_repository.get_project_by_id(project_id)
        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found.",
            )

        doc_count = await admin_repository.count_project_documents(project_id)
        if doc_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete project '{project.name}' because it contains {doc_count} associated document(s). Please remove all documents first.",
            )

        key_count = await admin_repository.count_project_api_keys(project_id)
        if key_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete project '{project.name}' because it contains {key_count} active API key(s). Please revoke or delete all API keys first.",
            )

        log_count = await admin_repository.count_project_request_logs(project_id)
        if log_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete project '{project.name}' because it has {log_count} recorded API request log(s).",
            )

        try:
            await admin_repository.delete_project(project_id)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="Unable to delete project due to associated records.",
            ) from exc


    async def get_documents(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        project_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ):
        skip = (page - 1) * page_size

        documents = await file_repository.list_all_files(
            search=search,
            organization_id=organization_id,
            project_id=project_id,
            skip=skip,
            take=page_size,
        )

        total = await file_repository.count_all_files(
            search=search,
            organization_id=organization_id,
            project_id=project_id,
        )

        return {
            "documents": documents,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    # -------------------------------------------------------------
    # Platform API Key Management
    # -------------------------------------------------------------

    async def get_api_keys(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        project_id: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        from app.repositories.api_key_repository import api_key_repository

        skip = (page - 1) * page_size

        keys, total = await asyncio.gather(
            admin_repository.list_all_api_keys(
                search=search,
                organization_id=organization_id,
                project_id=project_id,
                status=status,
                skip=skip,
                take=page_size,
            ),
            admin_repository.count_all_api_keys(
                search=search,
                organization_id=organization_id,
                project_id=project_id,
                status=status,
            ),
        )

        return {
            "api_keys": keys,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def revoke_api_key(
        self,
        api_key_id: str,
    ) -> None:
        from datetime import datetime, timezone
        from app.repositories.api_key_repository import api_key_repository

        key = await api_key_repository.get_by_id(api_key_id)

        if key is None:
            raise HTTPException(
                status_code=404,
                detail="API key not found",
            )

        # Keep revocation idempotent.
        if key.revokedAt is None:
            await api_key_repository.soft_revoke(
                api_key_id=api_key_id,
                revoked_at=datetime.now(timezone.utc),
            )

    # -------------------------------------------------------------
    # Platform API Monitoring
    # -------------------------------------------------------------

    async def get_monitoring_summary(
        self,
        days: int = 7,
    ) -> dict:
        from datetime import datetime, timedelta, timezone

        if days < 1 or days > 30:
            raise HTTPException(
                status_code=400,
                detail="Days must be between 1 and 30",
            )

        start_date = datetime.now(timezone.utc) - timedelta(
            days=days
        )

        total_requests, successful_requests, failed_requests, average_latency = (
            await asyncio.gather(
                admin_repository.count_all_request_logs(
                    start_date=start_date,
                ),
                admin_repository.count_request_logs_by_status(
                    start_date,
                    {
                        "gte": 200,
                        "lt": 400,
                    },
                ),
                admin_repository.count_request_logs_by_status(
                    start_date,
                    {
                        "gte": 400,
                    },
                ),
                admin_repository.get_average_request_latency(
                    start_date,
                ),
            )
        )

        error_rate = (
            (failed_requests / total_requests) * 100
            if total_requests
            else 0
        )

        return {
            "days": days,
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "error_rate": round(error_rate, 2),
            "average_latency_ms": round(
                average_latency,
                2,
            ),
        }

    async def get_monitoring_requests(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        project_id: str | None = None,
        method: str | None = None,
        status_category: str | None = None,
        days: int = 7,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        from datetime import datetime, timedelta, timezone

        if days < 1 or days > 30:
            raise HTTPException(
                status_code=400,
                detail="Days must be between 1 and 30",
            )

        if status_category and status_category not in {
            "success",
            "error",
        }:
            raise HTTPException(
                status_code=400,
                detail="Invalid status category",
            )

        start_date = datetime.now(timezone.utc) - timedelta(
            days=days
        )

        skip = (page - 1) * page_size

        filters = {
            "search": search,
            "organization_id": organization_id,
            "project_id": project_id,
            "method": method,
            "status_category": status_category,
            "start_date": start_date,
        }

        requests, total = await asyncio.gather(
            admin_repository.list_all_request_logs(
                skip=skip,
                take=page_size,
                **filters,
            ),
            admin_repository.count_all_request_logs(
                **filters,
            ),
        )

        return {
            "requests": requests,
            "total": total,
            "page": page,
            "page_size": page_size,
        }




admin_service = AdminService()
