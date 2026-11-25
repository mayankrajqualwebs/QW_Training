
"""
Admin Repository
================
Handles platform-wide database queries for Admin Console functionality.

Unlike user-facing repositories, these queries are not scoped to a
specific organization or project.
"""

from datetime import datetime, timezone

from app.db.client import prisma


class AdminRepository:
    """Repository for platform-wide administrative queries."""

    # -------------------------------------------------------------
    # Platform Statistics
    # -------------------------------------------------------------

    async def count_users(self) -> int:
        return await prisma.user.count()

    async def count_organizations(self) -> int:
        return await prisma.organization.count()

    async def count_projects(self) -> int:
        return await prisma.project.count()

    async def count_documents(self) -> int:
        return await prisma.projectfile.count()

    async def count_uploaded_documents(self) -> int:
        return await prisma.projectfile.count(
            where={"status": "UPLOADED"}
        )

    async def count_active_api_keys(self) -> int:
        now = datetime.now(timezone.utc)

        return await prisma.apikey.count(
            where={
                "revokedAt": None,
                "OR": [
                    {"expiresAt": None},
                    {"expiresAt": {"gt": now}},
                ],
            }
        )

    async def count_api_requests(self) -> int:
        return await prisma.requestlog.count()

    # -------------------------------------------------------------
    # Recent Platform Activity
    # -------------------------------------------------------------

    async def get_recent_users(self, limit: int = 5):
        return await prisma.user.find_many(
            take=limit,
            order={"createdAt": "desc"},
        )

    async def get_recent_documents(self, limit: int = 5):
        return await prisma.projectfile.find_many(
            where={"status": "UPLOADED"},
            take=limit,
            order={"createdAt": "desc"},
            include={
                "project": True,
                "uploadedBy": True,
            },
        )

    async def get_recent_requests(self, limit: int = 10):
        return await prisma.requestlog.find_many(
            take=limit,
            order={"createdAt": "desc"},
            include={
                "project": True,
                "apiKey": True,
            },
        )

    
    # -------------------------------------------------------------
    # User Management
    # -------------------------------------------------------------

    async def list_users(
        self,
        search: str | None = None,
        platform_role: str | None = None,
        skip: int = 0,
        take: int = 20,
    ):
        where = {}

        if search:
            where["email"] = {
                "contains": search.strip(),
                "mode": "insensitive",
            }

        if platform_role:
            where["platformRole"] = platform_role

        return await prisma.user.find_many(
            where=where,
            skip=skip,
            take=take,
            order={"createdAt": "desc"},
        )

    async def count_filtered_users(
        self,
        search: str | None = None,
        platform_role: str | None = None,
    ) -> int:
        where = {}

        if search:
            where["email"] = {
                "contains": search.strip(),
                "mode": "insensitive",
            }

        if platform_role:
            where["platformRole"] = platform_role

        return await prisma.user.count(where=where)

    async def get_user_by_id(self, user_id: str):
        return await prisma.user.find_unique(
            where={"id": user_id}
        )

    
    async def count_admins(self) -> int:
        return await prisma.user.count(
            where={"platformRole": "ADMIN"}
        )

    async def update_user_role(self, user_id: str, platform_role: str):
        return await prisma.user.update(
            where={"id": user_id},
            data={"platformRole": platform_role},
        )

    # -------------------------------------------------------------
    # Platform API Key Management
    # -------------------------------------------------------------

    def _api_key_filters(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        project_id: str | None = None,
        status: str | None = None,
    ) -> dict:
        from datetime import datetime, timezone

        where = {}

        if search and search.strip():
            term = search.strip()
            where["OR"] = [
                {"name": {"contains": term, "mode": "insensitive"}},
                {"keyPrefix": {"contains": term, "mode": "insensitive"}},
                {"keySuffix": {"contains": term, "mode": "insensitive"}},
            ]

        if project_id:
            where["projectId"] = project_id

        if organization_id:
            where["project"] = {
                "organizationId": organization_id,
            }

        now = datetime.now(timezone.utc)

        if status == "active":
            where["revokedAt"] = None
            where["AND"] = [
                {
                    "OR": [
                        {"expiresAt": None},
                        {"expiresAt": {"gt": now}},
                    ]
                }
            ]

        elif status == "revoked":
            where["revokedAt"] = {"not": None}

        elif status == "expired":
            where["revokedAt"] = None
            where["expiresAt"] = {"lte": now}

        return where

    async def list_all_api_keys(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        project_id: str | None = None,
        status: str | None = None,
        skip: int = 0,
        take: int = 20,
    ):
        where = self._api_key_filters(
            search=search,
            organization_id=organization_id,
            project_id=project_id,
            status=status,
        )

        return await prisma.apikey.find_many(
            where=where,
            skip=skip,
            take=take,
            order={"createdAt": "desc"},
            include={
                "project": {
                    "include": {
                        "organization": True,
                    },
                },
                "createdBy": True,
            },
        )

    async def count_all_api_keys(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        project_id: str | None = None,
        status: str | None = None,
    ) -> int:
        where = self._api_key_filters(
            search=search,
            organization_id=organization_id,
            project_id=project_id,
            status=status,
        )

        return await prisma.apikey.count(where=where)




admin_repository = AdminRepository()
