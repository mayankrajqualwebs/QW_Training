
"""
File Controller
===============
Handles HTTP requests and responses for project file management.
Delegates business logic to FileService and converts service
exceptions into appropriate HTTP responses.
"""

from typing import Any

from fastapi import HTTPException, status

from app.schemas.file import (
    FileUploadRequest,
    FileUploadResponse,
    FileResponse,
    FileDownloadResponse,
    FileVersionUploadRequest,
    FileVersionUploadResponse,
    FileVersionVerifyRequest,
    FileVersionResponse,
    FileVersionRestoreResponse,
)

from app.services.file_service import FileService, file_service

from app.exceptions.service_errors import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError as ServiceValidationError,
    ServiceUnavailableError,
    ServiceError,
)


class FileController:
    """Controller for file upload, retrieval, versioning and deletion."""

    def __init__(self, service: FileService = file_service):
        self.service = service

    # -------------------------------------------------------------------------
    # Exception Handling
    # -------------------------------------------------------------------------

    def _handle_service_error(self, exc: ServiceError) -> None:
        """Convert service exceptions into appropriate HTTP responses."""

        if isinstance(exc, NotFoundError):
            code = status.HTTP_404_NOT_FOUND

        elif isinstance(exc, ForbiddenError):
            code = status.HTTP_403_FORBIDDEN

        elif isinstance(exc, ConflictError):
            code = status.HTTP_409_CONFLICT

        elif isinstance(exc, ServiceValidationError):
            code = status.HTTP_422_UNPROCESSABLE_ENTITY

        elif isinstance(exc, ServiceUnavailableError):
            code = status.HTTP_503_SERVICE_UNAVAILABLE

        else:
            code = status.HTTP_500_INTERNAL_SERVER_ERROR

        raise HTTPException(
            status_code=code,
            detail=exc.message,
        ) from exc

    # -------------------------------------------------------------------------
    # Upload
    # -------------------------------------------------------------------------

    async def upload_file(
        self,
        project_id: str,
        data: FileUploadRequest,
        user: Any,
    ) -> FileUploadResponse:
        """Initiates a new file upload."""

        try:
            return await self.service.upload_file(
                project_id=project_id,
                user_id=user.id,
                data=data,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    async def verify_upload(
        self,
        file_id: str,
        user: Any,
    ) -> FileResponse:
        """Verifies and finalizes an uploaded file."""

        try:
            return await self.service.verify_upload(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # Version Upload
    # -------------------------------------------------------------------------

    async def initiate_version_upload(
        self,
        file_id: str,
        data: FileVersionUploadRequest,
        user: Any,
    ) -> FileVersionUploadResponse:
        """Initiates an upload for a new file version."""

        try:
            return await self.service.initiate_version_upload(
                file_id=file_id,
                user_id=user.id,
                data=data,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    async def verify_version_upload(
        self,
        file_id: str,
        version_number: int,
        data: FileVersionVerifyRequest,
        user: Any,
    ) -> FileResponse:
        """Verifies and finalizes a newly uploaded file version."""

        try:
            return await self.service.verify_version_upload(
                file_id=file_id,
                version_number=version_number,
                user_id=user.id,
                data=data,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # Retrieve
    # -------------------------------------------------------------------------

    async def get_file(
        self,
        file_id: str,
        user: Any,
    ) -> FileResponse:
        """Retrieves file metadata."""

        try:
            return await self.service.get_file(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    async def list_files(
        self,
        project_id: str,
        user: Any,
    ) -> list[FileResponse]:
        """Lists files belonging to a project."""

        try:
            return await self.service.list_files(
                project_id=project_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # File Download
    # -------------------------------------------------------------------------

    async def download_file(
        self,
        file_id: str,
        user: Any,
    ) -> FileDownloadResponse:
        """Generates a temporary download URL for a file."""

        try:
            return await self.service.download_file(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # Version History
    # -------------------------------------------------------------------------

    async def list_file_versions(
        self,
        file_id: str,
        user: Any,
    ) -> list[FileVersionResponse]:
        """Lists all versions of a file."""

        try:
            return await self.service.list_file_versions(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # Version Download
    # -------------------------------------------------------------------------

    async def download_file_version(
        self,
        file_id: str,
        version_number: int,
        user: Any,
    ) -> FileDownloadResponse:
        """Generates a download URL for a specific file version."""

        try:
            return await self.service.download_file_version(
                file_id=file_id,
                version_number=version_number,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # Restore Version
    # -------------------------------------------------------------------------

    async def restore_file_version(
        self,
        file_id: str,
        version_number: int,
        user: Any,
    ) -> FileVersionRestoreResponse:
        """Restores an earlier version as a new file version."""

        try:
            return await self.service.restore_file_version(
                file_id=file_id,
                version_number=version_number,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # Rename
    # -------------------------------------------------------------------------

    async def rename_file(
        self,
        file_id: str,
        new_name: str,
        user: Any,
    ) -> FileResponse:
        """Renames a file's display name."""

        try:
            return await self.service.rename_file(
                file_id=file_id,
                user_id=user.id,
                new_name=new_name,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # -------------------------------------------------------------------------
    # Delete
    # -------------------------------------------------------------------------

    async def delete_file(
        self,
        file_id: str,
        user: Any,
    ) -> dict:
        """Deletes a file and its associated versions."""

        try:
            return await self.service.delete_file(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)


# -----------------------------------------------------------------------------
# Shared Controller Instance
# -----------------------------------------------------------------------------

file_controller = FileController()
