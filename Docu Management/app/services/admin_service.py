
"""
Admin Service
=============
Coordinates platform-wide administrative statistics
and recent activity for the Admin Console.
"""

import asyncio
import re
import uuid
from fastapi import HTTPException, UploadFile
from datetime import datetime, timezone
from app.repositories.admin_repository import admin_repository
from app.repositories.project_repository import project_repository
from app.repositories.organization_repository import organization_repository
from app.repositories.file_repository import file_repository
from app.services.storage_service import storage_service

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

    async def get_document_details(self, document_id: str) -> dict:
        """Retrieve full details of a document including uploader and versions."""
        file = await admin_repository.get_document_by_id(document_id)
        if not file:
            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        versions = []
        for v in getattr(file, "versions", []):
            versions.append({
                "id": v.id,
                "version_number": v.versionNumber,
                "size": int(v.size),
                "content_type": v.contentType,
                "created_at": v.createdAt,
                "uploaded_by_id": v.uploadedById,
                "uploaded_by_email": getattr(getattr(v, "uploadedBy", None), "email", None),
            })

        status_val = (
            file.status.value
            if hasattr(file.status, "value")
            else str(file.status)
        )

        return {
            "id": file.id,
            "name": file.name,
            "original_name": file.originalName,
            "content_type": file.contentType,
            "size": int(file.size),
            "status": status_val,
            "current_version": file.currentVersion,
            "project_id": file.projectId,
            "project_name": file.project.name,
            "organization_id": file.project.organizationId,
            "organization_name": file.project.organization.name,
            "uploaded_by_id": file.uploadedById,
            "uploaded_by_email": getattr(getattr(file, "uploadedBy", None), "email", None),
            "created_at": file.createdAt,
            "updated_at": file.updatedAt,
            "versions": versions,
        }

    async def upload_document(
        self,
        file: UploadFile,
        project_id: str,
        name: str | None,
        current_admin_id: str,
    ) -> dict:
        """Direct multipart document upload by an administrator."""
        project = await admin_repository.get_project_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=404,
                detail="Selected project not found.",
            )

        filename = (name.strip() if name and name.strip() else file.filename or "").strip()
        if not filename:
            raise HTTPException(
                status_code=400,
                detail="Document must have a valid filename.",
            )

        raw_content_type = (file.content_type or "").strip().lower()
        allowed_types = {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        }
        ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""

        if raw_content_type in ("application/octet-stream", "", None):
            if ext == ".pdf":
                content_type = "application/pdf"
            elif ext == ".docx":
                content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            else:
                content_type = raw_content_type
        else:
            content_type = raw_content_type

        if content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only PDF and DOCX files are allowed.",
            )

        if ext not in allowed_types.get(content_type, []):
            raise HTTPException(
                status_code=400,
                detail=f"File extension '{ext}' does not match the content type.",
            )

        content = await file.read()
        size = len(content)

        if size <= 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file cannot be empty.",
            )

        max_size = 10 * 1024 * 1024  # 10 MB
        if size > max_size:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds the maximum allowed limit of 10 MB.",
            )

        # Validate magic bytes
        if content_type == "application/pdf" and not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is not a valid PDF document.",
            )
        if (
            content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            and not content.startswith(b"PK")
        ):
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is not a valid DOCX document.",
            )

        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", filename).strip("._")
        safe_name = re.sub(r"_+", "_", safe_name)
        object_key = (
            f"organizations/{project.organizationId}/"
            f"projects/{project_id}/"
            f"files/{uuid.uuid4().hex}_{safe_name}"
        )

        try:
            await storage_service.upload_file_content(
                object_key=object_key,
                content=content,
                content_type=content_type,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Storage upload failed: {str(exc)}",
            ) from exc

        try:
            file_record = await admin_repository.create_document_with_initial_version(
                name=filename,
                original_name=file.filename or filename,
                object_key=object_key,
                content_type=content_type,
                size=size,
                project_id=project_id,
                uploaded_by_id=current_admin_id,
            )
        except Exception as exc:
            try:
                await storage_service.delete_file(object_key)
            except Exception:
                pass
            raise HTTPException(
                status_code=500,
                detail="Failed to save document record.",
            ) from exc

        return await self.get_document_details(file_record.id)

    async def update_document_metadata(self, document_id: str, name: str) -> dict:
        """Update a document's display name."""
        file = await admin_repository.get_document_by_id(document_id)
        if not file:
            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        new_name = name.strip()
        if not new_name:
            raise HTTPException(
                status_code=400,
                detail="Document name cannot be empty.",
            )

        old_ext = ("." + file.originalName.rsplit(".", 1)[-1].lower()) if "." in file.originalName else ""
        new_ext = ("." + new_name.rsplit(".", 1)[-1].lower()) if "." in new_name else ""
        if old_ext != new_ext:
            raise HTTPException(
                status_code=400,
                detail=f"Renaming cannot change the file extension (expected '{old_ext}').",
            )

        await admin_repository.update_document_name(document_id=document_id, new_name=new_name)
        return await self.get_document_details(document_id)

    async def get_document_download(self, document_id: str) -> dict:
        """Generate a presigned download URL for a document."""
        file = await admin_repository.get_document_by_id(document_id)
        if not file:
            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        status_val = (
            file.status.value
            if hasattr(file.status, "value")
            else str(file.status)
        )
        if status_val != "UPLOADED":
            raise HTTPException(
                status_code=400,
                detail=f"Document is not available for download (status: {status_val}).",
            )

        exists = await storage_service.check_file_exists(file.objectKey)
        if not exists:
            raise HTTPException(
                status_code=404,
                detail="The file content could not be found in storage.",
            )

        download_url = await storage_service.generate_download_url(
            object_key=file.objectKey,
            expires_in=300,
        )

        return {
            "download_url": download_url,
            "filename": file.originalName,
            "expires_in": 300,
        }

    async def delete_document(self, document_id: str) -> None:
        """Permanently delete a document from storage and database."""
        file = await admin_repository.get_document_by_id(document_id)
        if not file:
            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        status_val = (
            file.status.value
            if hasattr(file.status, "value")
            else str(file.status)
        )
        if status_val == "DELETING":
            raise HTTPException(
                status_code=409,
                detail="Document deletion is already in progress.",
            )

        await admin_repository.mark_document_deleting(document_id)

        keys = {file.objectKey}
        for v in getattr(file, "versions", []):
            if getattr(v, "objectKey", None):
                keys.add(v.objectKey)

        for key in keys:
            try:
                await storage_service.delete_file(key)
            except Exception:
                pass

        await admin_repository.delete_document(document_id)

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

    async def create_api_key(
        self,
        name: str,
        project_id: str,
        user_id: str,
        scopes: list[str],
        expires_at: datetime | None,
        current_admin_id: str,
    ) -> dict:
        """Create a new API key from Admin Console with user assignment and scope configuration."""
        from datetime import datetime, timezone
        from app.core.security import generate_api_key, hash_api_key
        from app.repositories.membership_repository import membership_repository

        clean_name = name.strip()
        if len(clean_name) < 2 or len(clean_name) > 100:
            raise HTTPException(
                status_code=400,
                detail="API key name must be between 2 and 100 characters.",
            )

        project = await admin_repository.get_project_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=404,
                detail="Selected project not found.",
            )

        user = await admin_repository.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found.",
            )

        # Verify membership in the organization owning the project
        membership = await membership_repository.get_by_user_and_org(
            user_id=user_id,
            organization_id=project.organizationId,
        )
        user_role = (
            user.platformRole.value
            if hasattr(user.platformRole, "value")
            else str(user.platformRole)
        )
        if not membership and user_role != "ADMIN":
            raise HTTPException(
                status_code=400,
                detail=f"User '{user.email}' is not a member of organization '{project.organization.name}'.",
            )

        # Validate scopes
        if not scopes:
            raise HTTPException(
                status_code=400,
                detail="At least one scope must be selected.",
            )
        if len(set(scopes)) != len(scopes):
            raise HTTPException(
                status_code=400,
                detail="Duplicate scopes are not allowed.",
            )

        allowed_scopes = {"data:read", "data:write", "usage:read"}
        invalid_scopes = set(scopes) - allowed_scopes
        if invalid_scopes:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid scope(s): {', '.join(sorted(invalid_scopes))}. Supported scopes are: {', '.join(sorted(allowed_scopes))}.",
            )

        # Validate expiry
        if expires_at is not None:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=400,
                    detail="Expiration date must be in the future.",
                )

        raw_key = generate_api_key()
        key_hash = hash_api_key(raw_key)
        key_prefix = raw_key[:13]
        key_suffix = raw_key[-3:]

        key = await admin_repository.create_api_key(
            name=clean_name,
            key_prefix=key_prefix,
            key_suffix=key_suffix,
            key_hash=key_hash,
            scopes=scopes,
            project_id=project_id,
            user_id=user_id,
            expires_at=expires_at,
        )

        return {
            "id": key.id,
            "name": key.name,
            "key_prefix": key.keyPrefix,
            "key_suffix": getattr(key, "keySuffix", None) or key_suffix,
            "api_key": raw_key,  # Raw secret returned ONLY ONCE!
            "scopes": key.scopes,
            "status": "active",
            "expires_at": key.expiresAt,
            "created_at": key.createdAt,
            "project_id": key.projectId,
            "project_name": key.project.name,
            "organization_id": key.project.organizationId,
            "organization_name": key.project.organization.name,
            "created_by_id": key.createdById,
            "created_by_email": key.createdBy.email,
            "assigned_user_id": key.createdById,
            "assigned_user_email": key.createdBy.email,
        }

    async def reassign_api_key(
        self,
        api_key_id: str,
        new_user_id: str,
    ) -> dict:
        """Transfer ownership and authorization of an API key to another eligible user."""
        from datetime import datetime, timezone
        from app.repositories.membership_repository import membership_repository

        key = await admin_repository.get_api_key_by_id(api_key_id)
        if not key:
            raise HTTPException(
                status_code=404,
                detail="API key not found.",
            )

        now = datetime.now(timezone.utc)
        if key.revokedAt is not None:
            raise HTTPException(
                status_code=400,
                detail="Cannot reassign a revoked API key.",
            )

        target_user = await admin_repository.get_user_by_id(new_user_id)
        if not target_user:
            raise HTTPException(
                status_code=404,
                detail="Target user not found.",
            )

        # Check membership in the organization owning the project
        membership = await membership_repository.get_by_user_and_org(
            user_id=new_user_id,
            organization_id=key.project.organizationId,
        )
        target_role = (
            target_user.platformRole.value
            if hasattr(target_user.platformRole, "value")
            else str(target_user.platformRole)
        )
        if not membership and target_role != "ADMIN":
            raise HTTPException(
                status_code=400,
                detail=f"User '{target_user.email}' is not a member of organization '{key.project.organization.name}'.",
            )

        updated_key = await admin_repository.reassign_api_key_user(
            api_key_id=api_key_id,
            new_user_id=new_user_id,
        )

        if updated_key.revokedAt is not None:
            key_status = "revoked"
        elif updated_key.expiresAt is not None and updated_key.expiresAt <= now:
            key_status = "expired"
        else:
            key_status = "active"

        return {
            "id": updated_key.id,
            "name": updated_key.name,
            "key_prefix": updated_key.keyPrefix,
            "key_suffix": updated_key.keySuffix,
            "scopes": updated_key.scopes,
            "status": key_status,
            "expires_at": updated_key.expiresAt,
            "last_used_at": updated_key.lastUsedAt,
            "revoked_at": updated_key.revokedAt,
            "created_at": updated_key.createdAt,
            "project_id": updated_key.projectId,
            "project_name": updated_key.project.name,
            "organization_id": updated_key.project.organizationId,
            "organization_name": updated_key.project.organization.name,
            "created_by_id": updated_key.createdById,
            "created_by_email": updated_key.createdBy.email,
            "assigned_user_id": updated_key.createdById,
            "assigned_user_email": updated_key.createdBy.email,
        }

    async def get_organization_members(self, organization_id: str) -> list[dict]:
        """Retrieve members belonging to an organization for key assignment."""
        org = await admin_repository.get_organization_by_id(organization_id)
        if not org:
            raise HTTPException(
                status_code=404,
                detail="Organization not found.",
            )

        members = await admin_repository.get_organization_members(organization_id)
        return [
            {
                "id": m.user.id,
                "email": m.user.email,
                "role": str(m.role.value if hasattr(m.role, "value") else m.role),
            }
            for m in members
            if m.user
        ]

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
