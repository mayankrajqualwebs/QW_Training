
"""
Admin Service
=============
Coordinates platform-wide administrative statistics
and recent activity for the Admin Console.
"""

from app.repositories.admin_repository import admin_repository


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



admin_service = AdminService()
