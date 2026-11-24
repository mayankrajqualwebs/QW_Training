
"""
File Service
============
Handles business logic for project file management.

Responsibilities:
- Validate file uploads.
- Generate S3 upload and download URLs.
- Verify uploaded files.
- Manage file metadata and versions.
- Rename and delete files.
- Restore previous file versions.
"""

import re
import uuid

from app.repositories.file_repository import FileRepository
from app.repositories.project_repository import ProjectRepository
from app.services.storage_service import StorageService

from app.services.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)

from app.schemas.file import FileVersionVerifyRequest


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

UPLOAD_URL_EXPIRY = 300
DOWNLOAD_URL_EXPIRY = 300

ALLOWED_FILE_TYPES = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx"
    ],
}


class FileService:
    """Business logic for project file management."""

    def __init__(self):
        self.file_repo = FileRepository()
        self.project_repo = ProjectRepository()
        self.storage = StorageService()

    # -----------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------

    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """Generate a storage-safe filename."""

        filename = filename.strip()

        filename = re.sub(
            r"[^a-zA-Z0-9._-]",
            "_",
            filename,
        )

        filename = re.sub(
            r"_+",
            "_",
            filename,
        )

        return filename.strip("._")

    @staticmethod
    def _validate_file(
        filename: str,
        content_type: str,
        size: int,
    ) -> None:
        """Validate file name, MIME type, extension and size."""

        if not filename or not filename.strip():
            raise ValidationError("File name cannot be empty")

        if size <= 0:
            raise ValidationError("File cannot be empty")

        if size > MAX_FILE_SIZE:
            raise ValidationError(
                "File size exceeds the maximum allowed limit of 10 MB"
            )

        normalized_content_type = content_type.strip().lower()

        allowed_extensions = ALLOWED_FILE_TYPES.get(
            normalized_content_type
        )

        if not allowed_extensions:
            raise ValidationError(
                "Only PDF and DOCX files are allowed"
            )

        extension = (
            "." + filename.rsplit(".", 1)[-1].lower()
            if "." in filename
            else ""
        )

        if extension not in allowed_extensions:
            raise ValidationError(
                "File extension does not match the allowed file type"
            )

    @staticmethod
    def _validate_file_content(
        content: bytes,
        content_type: str,
    ) -> None:
        """Validate basic file signatures."""

        if not content:
            raise ValidationError("Uploaded file is empty")

        normalized_content_type = content_type.strip().lower()

        if normalized_content_type == "application/pdf":
            if not content.startswith(b"%PDF-"):
                raise ValidationError(
                    "Uploaded file is not a valid PDF"
                )

        elif normalized_content_type == (
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ):
            if not content.startswith(b"PK"):
                raise ValidationError(
                    "Uploaded file is not a valid DOCX"
                )

    @staticmethod
    def _get_role(membership) -> str:
        """Normalize a membership role."""

        if not membership:
            raise ForbiddenError(
                "You do not have access to this project"
            )

        return getattr(
            membership.role,
            "value",
            membership.role,
        )

    @classmethod
    def _check_upload_permission(cls, membership) -> None:
        """Check whether membership allows file modification."""

        role = cls._get_role(membership)

        if role not in ("OWNER", "ADMIN", "DEVELOPER"):
            raise ForbiddenError(
                "You do not have permission to manage project files"
            )

    @classmethod
    def _check_delete_permission(cls, membership) -> None:
        """Check whether membership allows file deletion."""

        role = cls._get_role(membership)

        if role not in ("OWNER", "ADMIN"):
            raise ForbiddenError(
                "Only organization owners and admins can delete files"
            )

    async def _get_project_and_check_access(
        self,
        project_id: str,
        user_id: str,
    ):
        """Fetch project and verify user access."""

        project = await self.project_repo.get_project_by_id(
            project_id
        )

        if not project:
            raise NotFoundError("Project not found")

        membership = await self.project_repo.get_user_membership(
            project.organizationId,
            user_id,
        )

        if not membership:
            raise ForbiddenError(
                "You do not have access to this project"
            )

        return project, membership

    async def _get_file_and_check_access(
        self,
        file_id: str,
        user_id: str,
    ):
        """Fetch file and verify user access."""

        file = await self.file_repo.get_file_by_id(file_id)

        if not file:
            raise NotFoundError("File not found")

        await self._get_project_and_check_access(
            file.projectId,
            user_id,
        )

        return file

    async def _get_file_membership(
        self,
        file,
        user_id: str,
    ):
        """Retrieve membership using the file's organization ID."""

        return await self.project_repo.get_user_membership(
            file.project.organizationId,
            user_id,
        )

    async def _to_file_response(self, file):
        """
        Convert a Prisma file record into the FileResponse structure.

        totalVersions is derived from the related FileVersion records.
        """

        versions = getattr(file, "versions", None)

        if versions is None:
            versions = await self.file_repo.list_file_versions(
                file.id
            )

        file_status = getattr(
            file.status,
            "value",
            file.status,
        )

        return {
            "id": file.id,
            "name": file.name,
            "originalName": file.originalName,
            "contentType": file.contentType,
            "size": int(file.size),
            "status": file_status,
            "projectId": file.projectId,
            "uploadedById": file.uploadedById,
            "createdAt": file.createdAt,
            "updatedAt": file.updatedAt,
            "totalVersions": len(versions),
        }

    @staticmethod
    def _validate_version_object_key(
        object_key: str,
        file,
        version_number: int,
    ) -> None:
        """Validate that an S3 object key belongs to the expected version."""

        if not object_key:
            raise ValidationError(
                "Object key is required"
            )

        expected_prefix = (
            f"organizations/{file.project.organizationId}/"
            f"projects/{file.projectId}/"
            f"files/{file.id}/versions/"
        )

        if not object_key.startswith(expected_prefix):
            raise ValidationError(
                "Invalid file version object key"
            )

        filename = object_key[len(expected_prefix):]

        pattern = (
            rf"^v{version_number}_[a-f0-9]{{32}}"
            rf"\.(pdf|docx)$"
        )

        if not re.fullmatch(pattern, filename):
            raise ValidationError(
                "Object key does not match the requested file version"
            )

    # -----------------------------------------------------------------
    # Upload File
    # -----------------------------------------------------------------

    async def upload_file(
        self,
        project_id: str,
        user_id: str,
        data,
    ):
        """Create a pending file record and generate an upload URL."""

        project, membership = await self._get_project_and_check_access(
            project_id,
            user_id,
        )

        self._check_upload_permission(membership)

        content_type = data.content_type.strip().lower()

        self._validate_file(
            filename=data.name,
            content_type=content_type,
            size=data.size,
        )

        safe_name = self._sanitize_filename(data.name)

        if not safe_name:
            raise ValidationError("Invalid file name")

        object_key = (
            f"organizations/{project.organizationId}/"
            f"projects/{project_id}/"
            f"files/{uuid.uuid4().hex}_{safe_name}"
        )

        try:
            upload_url = await self.storage.generate_upload_url(
                object_key=object_key,
                content_type=content_type,
                expires_in=UPLOAD_URL_EXPIRY,
            )

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to generate file upload URL"
            ) from error

        try:
            file = await self.file_repo.create_file(
                name=data.name.strip(),
                original_name=data.name.strip(),
                object_key=object_key,
                content_type=content_type,
                size=data.size,
                project_id=project_id,
                uploaded_by_id=user_id,
            )

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to create file record"
            ) from error

        return {
            "file_id": file.id,
            "object_key": object_key,
            "upload_url": upload_url,
            "expires_in": UPLOAD_URL_EXPIRY,
        }

    # -----------------------------------------------------------------
    # Verify Initial Upload
    # -----------------------------------------------------------------

    async def verify_upload(
        self,
        file_id: str,
        user_id: str,
    ):
        """Verify uploaded object and mark the file as uploaded."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        if file.status != "PENDING":
            raise ConflictError(
                "File is not awaiting upload verification"
            )

        try:
            if not await self.storage.check_file_exists(
                file.objectKey
            ):
                raise ValidationError(
                    "File upload has not been completed"
                )

            metadata = await self.storage.get_file_metadata(
                file.objectKey
            )

            if metadata["file_size"] != int(file.size):
                raise ValidationError(
                    "Uploaded file size does not match the declared size"
                )

            if metadata["content_type"] != file.contentType:
                raise ValidationError(
                    "Uploaded file content type does not match"
                )

            content = await self.storage.get_file_content(
                file.objectKey
            )

            self._validate_file_content(
                content,
                file.contentType,
            )

        except ValidationError:
            raise

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to verify uploaded file"
            ) from error

        try:
            updated_file = (
                await self.file_repo.mark_file_uploaded_with_version(
                    file_id=file.id,
                    version_number=1,
                    object_key=file.objectKey,
                    content_type=file.contentType,
                    size=int(file.size),
                    uploaded_by_id=user_id,
                )
            )

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to finalize uploaded file"
            ) from error

        return await self._to_file_response(updated_file)

    # -----------------------------------------------------------------
    # Initiate Version Upload
    # -----------------------------------------------------------------

    async def initiate_version_upload(
        self,
        file_id: str,
        user_id: str,
        data,
    ):
        """Generate an upload URL for a new file version."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        if file.status != "UPLOADED":
            raise ConflictError(
                "Only uploaded files can receive new versions"
            )

        membership = await self._get_file_membership(
            file,
            user_id,
        )

        self._check_upload_permission(membership)

        content_type = data.content_type.strip().lower()

        self._validate_file(
            filename=file.originalName,
            content_type=content_type,
            size=data.size,
        )

        extension = (
            ".pdf"
            if content_type == "application/pdf"
            else ".docx"
        )

        new_version_number = file.currentVersion + 1

        object_key = (
            f"organizations/{file.project.organizationId}/"
            f"projects/{file.projectId}/"
            f"files/{file.id}/"
            f"versions/v{new_version_number}_{uuid.uuid4().hex}{extension}"
        )

        try:
            upload_url = await self.storage.generate_upload_url(
                object_key=object_key,
                content_type=content_type,
                expires_in=UPLOAD_URL_EXPIRY,
            )

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to generate version upload URL"
            ) from error

        return {
            "file_id": file.id,
            "version_number": new_version_number,
            "object_key": object_key,
            "upload_url": upload_url,
            "expires_in": UPLOAD_URL_EXPIRY,
        }

    # -----------------------------------------------------------------
    # Verify Version Upload
    # -----------------------------------------------------------------

    async def verify_version_upload(
        self,
        file_id: str,
        version_number: int,
        user_id: str,
        data: FileVersionVerifyRequest,
    ):
        """Verify uploaded version and save its database record."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        if file.status != "UPLOADED":
            raise ConflictError(
                "File is not available for version updates"
            )

        membership = await self._get_file_membership(
            file,
            user_id,
        )

        self._check_upload_permission(membership)

        if version_number != file.currentVersion + 1:
            raise ConflictError(
                "Invalid file version number"
            )

        object_key = data.object_key

        self._validate_version_object_key(
            object_key,
            file,
            version_number,
        )

        content_type = data.content_type.strip().lower()

        self._validate_file(
            filename=file.originalName,
            content_type=content_type,
            size=data.size,
        )

        try:
            if not await self.storage.check_file_exists(
                object_key
            ):
                raise ValidationError(
                    "Version upload has not been completed"
                )

            metadata = await self.storage.get_file_metadata(
                object_key
            )

            if metadata["file_size"] != data.size:
                raise ValidationError(
                    "Uploaded version size does not match"
                )

            if metadata["content_type"] != content_type:
                raise ValidationError(
                    "Uploaded version content type does not match"
                )

            content = await self.storage.get_file_content(
                object_key
            )

            self._validate_file_content(
                content,
                content_type,
            )

        except ValidationError:
            raise

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to verify uploaded file version"
            ) from error

        try:
            updated_file = await self.file_repo.update_file_with_version(
                file_id=file.id,
                version_number=version_number,
                object_key=object_key,
                content_type=content_type,
                size=data.size,
                uploaded_by_id=user_id,
            )

        except Exception as error:
            try:
                await self.storage.delete_file(object_key)

            except Exception as cleanup_error:
                raise ServiceUnavailableError(
                    "Unable to save the file version or clean up "
                    "its S3 object"
                ) from cleanup_error

            raise ServiceUnavailableError(
                "Unable to save uploaded file version"
            ) from error

        return await self._to_file_response(updated_file)

    # -----------------------------------------------------------------
    # Get File
    # -----------------------------------------------------------------

    async def get_file(
        self,
        file_id: str,
        user_id: str,
    ):
        """Retrieve file details."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        return await self._to_file_response(file)

    # -----------------------------------------------------------------
    # List Files
    # -----------------------------------------------------------------

    async def list_files(
        self,
        project_id: str,
        user_id: str,
    ):
        """List all files belonging to a project."""

        await self._get_project_and_check_access(
            project_id,
            user_id,
        )

        files = await self.file_repo.list_project_files(
            project_id
        )

        return [
            await self._to_file_response(file)
            for file in files
        ]

    # -----------------------------------------------------------------
    # Download File
    # -----------------------------------------------------------------

    async def download_file(
        self,
        file_id: str,
        user_id: str,
    ):
        """Generate a temporary download URL."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        if file.status != "UPLOADED":
            raise ConflictError(
                "File is not available for download"
            )

        try:
            if not await self.storage.check_file_exists(
                file.objectKey
            ):
                raise NotFoundError(
                    "File does not exist in storage"
                )

            download_url = await self.storage.generate_download_url(
                object_key=file.objectKey,
                expires_in=DOWNLOAD_URL_EXPIRY,
            )

        except NotFoundError:
            raise

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to generate file download URL"
            ) from error

        return {
            "file_id": file.id,
            "download_url": download_url,
            "expires_in": DOWNLOAD_URL_EXPIRY,
        }

    # -----------------------------------------------------------------
    # Rename File
    # -----------------------------------------------------------------

    async def rename_file(
        self,
        file_id: str,
        user_id: str,
        new_name: str,
    ):
        """Rename a file's display name."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        membership = await self._get_file_membership(
            file,
            user_id,
        )

        self._check_upload_permission(membership)

        new_name = new_name.strip()

        if not new_name:
            raise ValidationError(
                "File name cannot be empty"
            )

        old_extension = (
            file.originalName.rsplit(".", 1)[-1].lower()
            if "." in file.originalName
            else ""
        )

        new_extension = (
            new_name.rsplit(".", 1)[-1].lower()
            if "." in new_name
            else ""
        )

        if old_extension != new_extension:
            raise ValidationError(
                "Renaming cannot change the file extension"
            )

        try:
            updated_file = await self.file_repo.update_file(
                file_id=file.id,
                name=new_name,
                original_name=new_name,
            )

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to rename file"
            ) from error

        return await self._to_file_response(updated_file)

    # -----------------------------------------------------------------
    # Delete File
    # -----------------------------------------------------------------

    async def delete_file(
        self,
        file_id: str,
        user_id: str,
    ):
        """Delete file metadata and all associated S3 objects."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        membership = await self._get_file_membership(
            file,
            user_id,
        )

        self._check_delete_permission(membership)

        if file.status == "DELETING":
            raise ConflictError(
                "File deletion is already in progress"
            )

        try:
            versions = await self.file_repo.list_file_versions(
                file.id
            )

            object_keys = {
                file.objectKey,
                *[
                    version.objectKey
                    for version in versions
                ],
            }

            await self.file_repo.update_file(
                file_id=file.id,
                status="DELETING",
            )

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to prepare file deletion"
            ) from error

        try:
            for object_key in object_keys:
                await self.storage.delete_file(object_key)

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to delete file objects from storage"
            ) from error

        try:
            await self.file_repo.delete_file(file.id)

        except Exception as error:
            raise ServiceUnavailableError(
                "File objects were deleted, but database cleanup failed"
            ) from error

        return {
            "message": "File deleted successfully",
            "file_id": file.id,
        }

    # -----------------------------------------------------------------
    # Reject Initial Upload
    # -----------------------------------------------------------------

    async def reject_upload(
        self,
        file_id: str,
        user_id: str,
    ):
        """Reject a pending upload and clean up its S3 object."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        membership = await self._get_file_membership(
            file,
            user_id,
        )

        self._check_upload_permission(membership)

        if file.status != "PENDING":
            raise ConflictError(
                "Only pending uploads can be rejected"
            )

        try:
            await self.storage.delete_file(file.objectKey)

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to clean up rejected upload"
            ) from error

        try:
            await self.file_repo.delete_file(file.id)

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to remove rejected file record"
            ) from error

        return {
            "message": "Upload rejected successfully",
            "file_id": file.id,
        }

    # -----------------------------------------------------------------
    # Reject Version Upload
    # -----------------------------------------------------------------

    async def reject_version_upload(
        self,
        file_id: str,
        object_key: str,
        user_id: str,
    ):
        """Remove an unverified version upload."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        membership = await self._get_file_membership(
            file,
            user_id,
        )

        self._check_upload_permission(membership)

        if not object_key:
            raise ValidationError(
                "Object key is required"
            )

        expected_prefix = (
            f"organizations/{file.project.organizationId}/"
            f"projects/{file.projectId}/"
            f"files/{file.id}/versions/"
        )

        if not object_key.startswith(expected_prefix):
            raise ValidationError(
                "Invalid file version object key"
            )

        try:
            await self.storage.delete_file(object_key)

        except Exception as error:
            raise ServiceUnavailableError(
                "Could not clean up the invalid version upload"
            ) from error

        return {
            "message": "Version upload rejected successfully",
            "file_id": file.id,
        }

    # -----------------------------------------------------------------
    # List File Versions
    # -----------------------------------------------------------------

    async def list_file_versions(
        self,
        file_id: str,
        user_id: str,
    ):
        """Retrieve version history for a file."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        return await self.file_repo.list_file_versions(
            file.id
        )

    # -----------------------------------------------------------------
    # Download File Version
    # -----------------------------------------------------------------

    async def download_file_version(
        self,
        file_id: str,
        version_number: int,
        user_id: str,
    ):
        """Generate a download URL for a specific version."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        version = await self.file_repo.get_file_version(
            file_id=file.id,
            version_number=version_number,
        )

        if not version:
            raise NotFoundError(
                "File version not found"
            )

        try:
            if not await self.storage.check_file_exists(
                version.objectKey
            ):
                raise NotFoundError(
                    "File version does not exist in storage"
                )

            download_url = await self.storage.generate_download_url(
                object_key=version.objectKey,
                expires_in=DOWNLOAD_URL_EXPIRY,
            )

        except NotFoundError:
            raise

        except Exception as error:
            raise ServiceUnavailableError(
                "Unable to generate version download URL"
            ) from error

        return {
            "file_id": file.id,
            "version_number": version.versionNumber,
            "download_url": download_url,
            "expires_in": DOWNLOAD_URL_EXPIRY,
        }

    # -----------------------------------------------------------------
    # Restore File Version
    # -----------------------------------------------------------------

    async def restore_file_version(
        self,
        file_id: str,
        version_number: int,
        user_id: str,
    ):
        """Restore a previous version as a new current version."""

        file = await self._get_file_and_check_access(
            file_id,
            user_id,
        )

        if file.status != "UPLOADED":
            raise ConflictError(
                "Only uploaded files can be restored"
            )

        membership = await self._get_file_membership(
            file,
            user_id,
        )

        self._check_upload_permission(membership)

        source_version = await self.file_repo.get_file_version(
            file_id=file.id,
            version_number=version_number,
        )

        if not source_version:
            raise NotFoundError(
                "File version not found"
            )

        if version_number == file.currentVersion:
            raise ConflictError(
                "This version is already the current version"
            )

        new_version_number = file.currentVersion + 1

        extension = (
            ".pdf"
            if source_version.contentType == "application/pdf"
            else ".docx"
        )

        new_object_key = (
            f"organizations/{file.project.organizationId}/"
            f"projects/{file.projectId}/"
            f"files/{file.id}/"
            f"versions/v{new_version_number}_restore_{uuid.uuid4().hex}{extension}"
        )

        try:
            await self.storage.copy_file(
                source_object_key=source_version.objectKey,
                destination_object_key=new_object_key,
            )

            await self.file_repo.update_file_with_version(
                file_id=file.id,
                version_number=new_version_number,
                object_key=new_object_key,
                content_type=source_version.contentType,
                size=int(source_version.size),
                uploaded_by_id=user_id,
            )

        except Exception as error:
            try:
                await self.storage.delete_file(
                    new_object_key
                )

            except Exception as cleanup_error:
                raise ServiceUnavailableError(
                    "Unable to restore the file version or "
                    "clean up the copied S3 object"
                ) from cleanup_error

            raise ServiceUnavailableError(
                "Unable to restore file version"
            ) from error

        return {
            "file_id": file.id,
            "restored_from_version": version_number,
            "new_version_number": new_version_number,
            "message": "File version restored successfully",
        }


file_service = FileService()
