
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

    async def get_user_by_email(self, email: str):
        return await prisma.user.find_unique(
            where={"email": email.lower().strip()}
        )

    async def create_user(
        self,
        email: str,
        password_hash: str,
        platform_role: str = "USER",
    ):
        return await prisma.user.create(
            data={
                "email": email.lower().strip(),
                "passwordHash": password_hash,
                "platformRole": platform_role,
            }
        )

    async def count_user_created_organizations(self, user_id: str) -> int:
        return await prisma.organization.count(where={"createdById": user_id})

    async def count_user_created_api_keys(self, user_id: str) -> int:
        return await prisma.apikey.count(where={"createdById": user_id})

    async def count_user_uploaded_files(self, user_id: str) -> int:
        return await prisma.projectfile.count(where={"uploadedById": user_id})

    async def count_user_uploaded_file_versions(self, user_id: str) -> int:
        return await prisma.fileversion.count(where={"uploadedById": user_id})

    async def delete_user(self, user_id: str):
        return await prisma.user.delete(
            where={"id": user_id}
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




    # -------------------------------------------------------------
    # Platform API Monitoring
    # -------------------------------------------------------------

    def _request_log_filters(
        self,
        search: str | None = None,
        organization_id: str | None = None,
        project_id: str | None = None,
        method: str | None = None,
        status_category: str | None = None,
        start_date: datetime | None = None,
    ) -> dict:
        where = {}

        if search and search.strip():
            term = search.strip()

            where["OR"] = [
                {
                    "path": {
                        "contains": term,
                        "mode": "insensitive",
                    }
                },
                {
                    "method": {
                        "contains": term,
                        "mode": "insensitive",
                    }
                },
            ]

        if organization_id:
            where["project"] = {
                "organizationId": organization_id,
            }

        if project_id:
            where["projectId"] = project_id

        if method:
            where["method"] = method.upper()

        if start_date:
            where["createdAt"] = {
                "gte": start_date,
            }

        if status_category == "success":
            where["statusCode"] = {
                "gte": 200,
                "lt": 400,
            }

        elif status_category == "error":
            where["statusCode"] = {
                "gte": 400,
            }

        return where

    async def count_all_request_logs(
        self,
        **filters,
    ) -> int:
        where = self._request_log_filters(**filters)

        return await prisma.requestlog.count(
            where=where,
        )

    async def list_all_request_logs(
        self,
        skip: int = 0,
        take: int = 20,
        **filters,
    ):
        where = self._request_log_filters(**filters)

        return await prisma.requestlog.find_many(
            where=where,
            skip=skip,
            take=take,
            order={
                "createdAt": "desc",
            },
            include={
                "project": {
                    "include": {
                        "organization": True,
                    },
                },
                "apiKey": True,
            },
        )

    async def count_request_logs_by_status(
        self,
        start_date: datetime,
        status_code_filter: dict,
    ) -> int:
        return await prisma.requestlog.count(
            where={
                "createdAt": {
                    "gte": start_date,
                },
                "statusCode": status_code_filter,
            }
        )

    async def get_average_request_latency(self, start_date):
        result = await prisma.query_raw(
            """
            SELECT AVG("latencyMs") AS "avgLatency"
            FROM "RequestLog"
            WHERE "createdAt" >= $1::timestamp
            """,
            start_date,
        )

        if not result:
            return 0.0

        average = result[0].get("avgLatency")

        return float(average or 0)


admin_repository = AdminRepository()
