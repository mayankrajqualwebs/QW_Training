
"""
File Repository
===============
Handles database operations for project files and their versions
using Prisma and PostgreSQL.
"""

from app.db.client import prisma


class FileRepository:
    """Repository for managing project files and file versions."""

    # -----------------------------------------------------------------
    # File Creation and Retrieval
    # -----------------------------------------------------------------

    async def create_file(
        self,
        name: str,
        original_name: str,
        object_key: str,
        content_type: str,
        size: int,
        project_id: str,
        uploaded_by_id: str,
    ):
        """Create a new pending file record."""

        return await prisma.projectfile.create(
            data={
                "name": name,
                "originalName": original_name,
                "objectKey": object_key,
                "contentType": content_type,
                "size": size,
                "projectId": project_id,
                "uploadedById": uploaded_by_id,
            },
            include={
                "project": True,
                "versions": True,
            },
        )

    async def get_file_by_id(self, file_id: str):
        """Retrieve a file with its project and version records."""

        return await prisma.projectfile.find_unique(
            where={
                "id": file_id,
            },
            include={
                "project": True,
                "versions": True,
            },
        )

    async def get_file_by_object_key(self, object_key: str):
        """Retrieve a file using its unique S3 object key."""

        return await prisma.projectfile.find_unique(
            where={
                "objectKey": object_key,
            },
            include={
                "project": True,
                "versions": True,
            },
        )

    async def list_project_files(self, project_id: str):
        """Retrieve project files, excluding files being deleted."""

        return await prisma.projectfile.find_many(
            where={
                "projectId": project_id,
                "status": {
                    "not": "DELETING",
                },
            },
            order={
                "createdAt": "desc",
            },
            include={
                "project": True,
                "versions": True,
            },
        )

    # -----------------------------------------------------------------
    # File Updates and Deletion
    # -----------------------------------------------------------------

    @staticmethod
    def _normalize_update_fields(data: dict) -> dict:
        """
        Convert Python snake_case field names into Prisma field names.

        This allows service methods to use Python naming conventions
        without passing invalid field names to Prisma.
        """

        field_mapping = {
            "original_name": "originalName",
            "object_key": "objectKey",
            "content_type": "contentType",
            "project_id": "projectId",
            "uploaded_by_id": "uploadedById",
            "current_version": "currentVersion",
        }

        return {
            field_mapping.get(key, key): value
            for key, value in data.items()
        }

    async def update_file(
        self,
        file_id: str,
        data: dict | None = None,
        **fields,
    ):
        """
        Update file information.

        Supports both calling styles:

        update_file(file_id, {"status": "DELETING"})

        update_file(file_id, status="DELETING")
        """

        update_data = {}

        if data:
            update_data.update(data)

        update_data.update(fields)

        if not update_data:
            raise ValueError(
                "At least one field is required to update a file"
            )

        update_data = self._normalize_update_fields(
            update_data
        )

        return await prisma.projectfile.update(
            where={
                "id": file_id,
            },
            data=update_data,
            include={
                "project": True,
                "versions": True,
            },
        )

    async def delete_file(self, file_id: str):
        """Delete a file record from PostgreSQL."""

        return await prisma.projectfile.delete(
            where={
                "id": file_id,
            }
        )

    # -----------------------------------------------------------------
    # File Version Creation and Retrieval
    # -----------------------------------------------------------------

    async def create_file_version(
        self,
        file_id: str,
        version_number: int,
        object_key: str,
        content_type: str,
        size: int,
        uploaded_by_id: str,
    ):
        """Create a file version record."""

        return await prisma.fileversion.create(
            data={
                "fileId": file_id,
                "versionNumber": version_number,
                "objectKey": object_key,
                "contentType": content_type,
                "size": size,
                "uploadedById": uploaded_by_id,
            }
        )

    async def list_file_versions(self, file_id: str):
        """Retrieve all versions of a file, newest first."""

        return await prisma.fileversion.find_many(
            where={
                "fileId": file_id,
            },
            order={
                "versionNumber": "desc",
            },
        )

    async def get_file_version(
        self,
        file_id: str,
        version_number: int,
    ):
        """Retrieve a specific version of a file."""

        return await prisma.fileversion.find_first(
            where={
                "fileId": file_id,
                "versionNumber": version_number,
            }
        )

    async def list_versions_for_files(
        self,
        file_ids: list[str],
    ):
        """Retrieve versions belonging to multiple files."""

        if not file_ids:
            return []

        return await prisma.fileversion.find_many(
            where={
                "fileId": {
                    "in": file_ids,
                },
            },
            order={
                "versionNumber": "desc",
            },
        )

    # -----------------------------------------------------------------
    # Initial Upload Finalization
    # -----------------------------------------------------------------

    async def mark_file_uploaded_with_version(
        self,
        file_id: str,
        object_key: str,
        content_type: str,
        size: int,
        uploaded_by_id: str,
        version_number: int = 1,
    ):
        """
        Mark a pending file as uploaded and create its first version.

        Prisma performs the parent update and nested version creation
        as one database operation.
        """

        return await prisma.projectfile.update(
            where={
                "id": file_id,
            },
            data={
                "status": "UPLOADED",
                "currentVersion": version_number,
                "versions": {
                    "create": {
                        "versionNumber": version_number,
                        "objectKey": object_key,
                        "contentType": content_type,
                        "size": size,
                        "uploadedBy": {
                            "connect": {
                                "id": uploaded_by_id,
                            }
                        },
                    }
                },
            },
            include={
                "project": True,
                "versions": True,
            },
        )

    # -----------------------------------------------------------------
    # New Version Finalization
    # -----------------------------------------------------------------

    async def update_file_with_version(
        self,
        file_id: str,
        version_number: int,
        object_key: str,
        content_type: str,
        size: int,
        uploaded_by_id: str,
    ):
        """
        Update the current file object and create its new version.

        The file update and nested version creation are performed
        together by Prisma.
        """

        return await prisma.projectfile.update(
            where={
                "id": file_id,
            },
            data={
                "objectKey": object_key,
                "contentType": content_type,
                "size": size,
                "currentVersion": version_number,
                "versions": {
                    "create": {
                        "versionNumber": version_number,
                        "objectKey": object_key,
                        "contentType": content_type,
                        "size": size,
                        "uploadedBy": {
                            "connect": {
                                "id": uploaded_by_id,
                            }
                        },
                    }
                },
            },
            include={
                "project": True,
                "versions": True,
            },
        )

    # -----------------------------------------------------------------
    # Existing Data Migration Helper
    # -----------------------------------------------------------------

    async def backfill_file_versions(self):
        """Create missing version 1 records for uploaded files."""

        files = await prisma.projectfile.find_many(
            where={
                "status": "UPLOADED",
                "versions": {
                    "none": {},
                },
            }
        )

        created_count = 0

        for file in files:
            await prisma.fileversion.upsert(
                where={
                    "fileId_versionNumber": {
                        "fileId": file.id,
                        "versionNumber": 1,
                    }
                },
                data={
                    "create": {
                        "fileId": file.id,
                        "versionNumber": 1,
                        "objectKey": file.objectKey,
                        "contentType": file.contentType,
                        "size": int(file.size),
                        "uploadedById": file.uploadedById,
                    },
                    "update": {},
                },
            )

            created_count += 1

        return created_count


# ---------------------------------------------------------------------
# Shared Repository Instance
# ---------------------------------------------------------------------

file_repository = FileRepository()
