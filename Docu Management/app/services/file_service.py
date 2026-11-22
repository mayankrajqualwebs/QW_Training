
"""
File Service
============
Business logic for project file management.

Responsibilities:
- Verify project membership and permissions.
- Initiate secure file uploads.
- Verify completed S3 uploads.
- Generate secure download URLs.
- Rename and delete files.
- Coordinate AWS S3 and PostgreSQL operations.
"""

import re
from uuid import uuid4
from typing import Set

from io import BytesIO
from zipfile import ZipFile, BadZipFile

from app.repositories.file_repository import (
    FileRepository,
    file_repository,
)
from app.repositories.project_repository import (
    ProjectRepository,
    project_repository,
)
from app.repositories.membership_repository import (
    MembershipRepository,
    membership_repository,
)
from app.schemas.file import (
    FileUploadRequest,
    FileUploadResponse,
    FileDownloadResponse,
)
from app.services.storage_service import (
    StorageService,
    storage_service,
)
from app.services.exceptions import (
    ForbiddenError,
    NotFoundError,
    ValidationError,
    ServiceUnavailableError,
)


# File permission policies
FILE_UPLOAD_ROLES: Set[str] = {"OWNER", "ADMIN", "DEVELOPER"}
FILE_ADMIN_ROLES: Set[str] = {"OWNER", "ADMIN"}


# Supported document formats
ALLOWED_FILE_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class FileService:
    """Service handling project file management and authorization."""

    def __init__(
        self,
        file_repo: FileRepository = file_repository,
        project_repo: ProjectRepository = project_repository,
        membership_repo: MembershipRepository = membership_repository,
        storage: StorageService = storage_service,
    ):
        self.file_repo = file_repo
        self.project_repo = project_repo
        self.membership_repo = membership_repo
        self.storage = storage

    # ---------------------------------------------------------
    # Authorization
    # ---------------------------------------------------------

    async def verify_project_access(
        self,
        project_id: str,
        user_id: str,
    ):
        """
        Verify that the project exists and the user belongs
        to its organization.
        """

        project = await self.project_repo.get_by_id(project_id)

        if project is None:
            raise NotFoundError("Project not found")

        membership = await self.membership_repo.get_by_user_and_org(
            user_id=user_id,
            organization_id=project.organizationId,
        )

        if membership is None:
            raise NotFoundError("Project not found")

        return project, membership

    def get_role(self, membership) -> str:
        """Normalize the membership role."""

        return getattr(membership.role, "value", membership.role)

    async def verify_file_access(
        self,
        file_id: str,
        user_id: str,
    ):
        """Retrieve a file and verify project membership."""

        file = await self.file_repo.get_file_by_id(file_id)

        if file is None:
            raise NotFoundError("File not found")

        project, membership = await self.verify_project_access(
            project_id=file.projectId,
            user_id=user_id,
        )

        return file, project, membership

    def verify_file_management_permission(
        self,
        file,
        membership,
        user_id: str,
    ):
        """
        OWNER and ADMIN can manage all files.
        DEVELOPER can manage only their own files.
        """

        role = self.get_role(membership)

        if role in FILE_ADMIN_ROLES:
            return

        if role == "DEVELOPER" and file.uploadedById == user_id:
            return

        raise ForbiddenError(
            "You do not have permission to modify this file"
        )

    # ---------------------------------------------------------
    # Upload
    # ---------------------------------------------------------

    async def upload_file(
        self,
        project_id: str,
        user_id: str,
        data: FileUploadRequest,
    ) -> FileUploadResponse:
        """
        Create a pending file record and generate
        a temporary S3 upload URL.
        """

        project, membership = await self.verify_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        role = self.get_role(membership)

        if role not in FILE_UPLOAD_ROLES:
            raise ForbiddenError(
                "Your organization role cannot upload files"
            )

        # Prevent directory traversal and unsafe S3 filenames.
        original_name = data.name.strip()

        if not original_name:
            raise ValidationError("Filename cannot be empty")

        safe_name = re.sub(
            r"[^A-Za-z0-9._-]",
            "_",
            original_name.replace("\\", "/").split("/")[-1],
        ).strip(".")

        if not safe_name:
            raise ValidationError("Invalid filename")

        
        # Validate file extension and MIME type.
        extension = "." + safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else ""

        expected_content_type = ALLOWED_FILE_TYPES.get(extension)

        if expected_content_type is None:
            raise ValidationError(
                "Unsupported file format. Only PDF and DOCX files are allowed."
            )

        content_type = data.content_type.strip().lower()

        if content_type != expected_content_type:
            raise ValidationError(
                "File extension does not match the provided content type."
            )


        # Generate a unique storage path.
        object_key = (
            f"organizations/{project.organizationId}/"
            f"projects/{project_id}/files/"
            f"{uuid4().hex}/{safe_name}"
        )

        # Create a pending database record.
        file = await self.file_repo.create_file(
            name=original_name,
            original_name=original_name,
            object_key=object_key,
            content_type=content_type,          
            size=data.size,
            project_id=project_id,
            uploaded_by_id=user_id,
        )

        try:
            upload_url = self.storage.generate_upload_url(
                object_key=object_key,
                content_type=data.content_type,
                expires_in=300,
            )

        except Exception as error:
            # Avoid leaving a pending record when URL creation fails.
            await self.file_repo.delete_file(file.id)

            raise ServiceUnavailableError(
                "Unable to generate upload URL"
            ) from error

        return FileUploadResponse(
            file_id=file.id,
            object_key=object_key,
            upload_url=upload_url,
            expires_in=300,
        )

    # ---------------------------------------------------------
    # Upload Verification
    # ---------------------------------------------------------

    
    async def verify_upload(
        self,
        file_id: str,
        user_id: str,
    ):
        """
        Verify that the uploaded object exists in S3 and
        matches the expected size, content type, and file format.
        """

        file, _, membership = await self.verify_file_access(
            file_id=file_id,
            user_id=user_id,
        )

        role = self.get_role(membership)

        if role not in FILE_UPLOAD_ROLES:
            raise ForbiddenError(
                "Your organization role cannot verify uploads"
            )

        if file.uploadedById != user_id and role not in FILE_ADMIN_ROLES:
            raise ForbiddenError(
                "You cannot verify another user's upload"
            )

        if file.status == "UPLOADED":
            return file

        if not self.storage.check_file_exists(file.objectKey):
            raise ValidationError(
                "File upload has not been completed"
            )

        metadata = self.storage.get_file_metadata(file.objectKey)

        if metadata["file_size"] != int(file.size):
            await self.reject_upload(
                file,
                "Uploaded file size does not match the expected size",
            )

        if metadata["content_type"] != file.contentType:
            await self.reject_upload(
                file,
                "Uploaded file content type does not match",
            )

        # Validate actual file contents.
        content = self.storage.get_file_content(file.objectKey)

        if not self.validate_file_content(file.name, content):
            await self.reject_upload(
                file,
                "Uploaded file content does not match the expected file format",
            )

        return await self.file_repo.update_file(
            file_id=file.id,
            data={"status": "UPLOADED"},
        )


    # ---------------------------------------------------------
    # Retrieve
    # ---------------------------------------------------------

    async def get_file(
        self,
        file_id: str,
        user_id: str,
    ):
        """Retrieve an authorized file record."""

        file, _, _ = await self.verify_file_access(
            file_id=file_id,
            user_id=user_id,
        )

        return file

    # ---------------------------------------------------------
    # List
    # ---------------------------------------------------------

    async def list_files(
        self,
        project_id: str,
        user_id: str,
    ):
        """List files belonging to an authorized project."""

        await self.verify_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        return await self.file_repo.list_project_files(
            project_id=project_id
        )

    # ---------------------------------------------------------
    # Download
    # ---------------------------------------------------------

    async def download_file(
        self,
        file_id: str,
        user_id: str,
    ) -> FileDownloadResponse:
        """Generate a temporary download URL for an uploaded file."""

        file, _, _ = await self.verify_file_access(
            file_id=file_id,
            user_id=user_id,
        )

        if file.status != "UPLOADED":
            raise ValidationError(
                "File is not available for download"
            )

        if not self.storage.check_file_exists(file.objectKey):
            raise NotFoundError(
                "File does not exist in storage"
            )

        download_url = self.storage.generate_download_url(
            object_key=file.objectKey,
            expires_in=300,
        )

        return FileDownloadResponse(
            file_id=file.id,
            download_url=download_url,
            expires_in=300,
        )

    # ---------------------------------------------------------
    # Rename
    # ---------------------------------------------------------

    async def rename_file(
        self,
        file_id: str,
        user_id: str,
        new_name: str,
    ):
        """
        Rename a file in S3 and update its database record.
        """

        file, _, membership = await self.verify_file_access(
            file_id=file_id,
            user_id=user_id,
        )

        self.verify_file_management_permission(
            file=file,
            membership=membership,
            user_id=user_id,
        )

        new_name = new_name.strip()

        if not new_name:
            raise ValidationError("Filename cannot be empty")

        safe_name = re.sub(
            r"[^A-Za-z0-9._-]",
            "_",
            new_name.replace("\\", "/").split("/")[-1],
        ).strip(".")

        if not safe_name:
            raise ValidationError("Invalid filename")

        if file.status != "UPLOADED":
            raise ValidationError(
                "Only completed uploads can be renamed"
            )

        old_object_key = file.objectKey

        new_object_key = (
            old_object_key.rsplit("/", 1)[0]
            + "/"
            + safe_name
        )

        if new_object_key == old_object_key:
            return await self.file_repo.update_file(
                file_id=file.id,
                data={"name": new_name},
            )

        try:
            self.storage.rename_file(
                old_object_key=old_object_key,
                new_object_key=new_object_key,
            )

            return await self.file_repo.update_file(
                file_id=file.id,
                data={
                    "name": new_name,
                    "objectKey": new_object_key,
                },
            )

        except Exception as error:
            # Attempt to restore the original S3 object key
            # if the database update fails after the S3 rename.
            try:
                if self.storage.check_file_exists(new_object_key):
                    self.storage.rename_file(
                        old_object_key=new_object_key,
                        new_object_key=old_object_key,
                    )
            except Exception:
                pass

            raise ServiceUnavailableError(
                "Unable to rename file"
            ) from error

    # ---------------------------------------------------------
    # Delete
    # ---------------------------------------------------------

    async def delete_file(
        self,
        file_id: str,
        user_id: str,
    ):
        """Delete an authorized file from S3 and PostgreSQL."""

        file, _, membership = await self.verify_file_access(
            file_id=file_id,
            user_id=user_id,
        )

        self.verify_file_management_permission(
            file=file,
            membership=membership,
            user_id=user_id,
        )

        try:
            if self.storage.check_file_exists(file.objectKey):
                self.storage.delete_file(file.objectKey)

            return await self.file_repo.delete_file(file.id)

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to delete file"
            ) from error

    
    def validate_file_content(self, file_name: str, content: bytes) -> bool:
        """Validate actual file contents using file signatures."""

        extension = "." + file_name.rsplit(".", 1)[-1].lower()

        # PDF signature validation
        if extension == ".pdf":
            return content.startswith(b"%PDF-")

        # DOCX validation (ZIP-based Office document)
        if extension == ".docx":
            try:
                with ZipFile(BytesIO(content)) as archive:
                    required_files = {
                        "[Content_Types].xml",
                        "word/document.xml",
                    }

                    return required_files.issubset(
                        set(archive.namelist())
                    )

            except BadZipFile:
                return False

        return False

        
    async def reject_upload(self, file, message: str):
        """Remove an invalid uploaded object and its pending record."""

        try:
            self.storage.delete_file(file.objectKey)
            await self.file_repo.delete_file(file.id)

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to clean up invalid uploaded file"
            ) from error

        raise ValidationError(message)




# Shared service instance
file_service = FileService()
