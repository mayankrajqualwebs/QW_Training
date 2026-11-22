
"""
File Repository
===============
Handles database operations for project files using Prisma.
"""

from app.db.client import prisma


class FileRepository:
    """Repository for managing file records."""

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
        """Create a new file record."""

        return await prisma.projectfile.create(
            data={
                "name": name,
                "originalName": original_name,
                "objectKey": object_key,
                "contentType": content_type,
                "size": size,
                "projectId": project_id,
                "uploadedById": uploaded_by_id,
            }
        )

    async def get_file_by_id(self, file_id: str):
        """Retrieve a file using its ID."""

        return await prisma.projectfile.find_unique(
            where={"id": file_id}
        )

    async def get_file_by_object_key(self, object_key: str):
        """Retrieve a file using its S3 object key."""

        return await prisma.projectfile.find_unique(
            where={"objectKey": object_key}
        )

    async def list_project_files(self, project_id: str):
        """Retrieve all files belonging to a project."""

        return await prisma.projectfile.find_many(
            where={"projectId": project_id},
            order={"createdAt": "desc"},
        )

    async def update_file(self, file_id: str, data: dict):
        """Update file information."""

        return await prisma.projectfile.update(
            where={"id": file_id},
            data=data,
        )

    async def delete_file(self, file_id: str):
        """Delete a file record from the database."""

        return await prisma.projectfile.delete(
            where={"id": file_id}
        )

    
    async def create_file_version(
        self,
        file_id: str,
        version_number: int,
        object_key: str,
        content_type: str,
        size: int,
        uploaded_by_id: str,
    ):
        """Create a new version record for a file."""

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
        """Retrieve all versions of a file."""

        return await prisma.fileversion.find_many(
            where={"fileId": file_id},
            order={"versionNumber": "desc"},
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


    async def backfill_file_versions(self):
        """Create version 1 records for existing uploaded files."""

        files = await prisma.projectfile.find_many(
            where={
                "status": "UPLOADED",
                "versions": {
                    "none": {},
                },
            }
        )

        for file in files:
            await self.create_file_version(
                file_id=file.id,
                version_number=1,
                object_key=file.objectKey,
                content_type=file.contentType,
                size=int(file.size),
                uploaded_by_id=file.uploadedById,
            )

        return len(files)



# Shared repository instance
file_repository = FileRepository()
