
"""
File Controller
===============
Handles HTTP requests and responses for project file management.
"""

from typing import Any

from fastapi import HTTPException, status

from app.schemas.file import (
    FileUploadRequest,
    FileUploadResponse,
    FileDownloadResponse,
    FileVersionUploadRequest,
    FileVersionUploadResponse,
)
from app.services.file_service import FileService, file_service
from app.services.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError as ServiceValidationError,
    ServiceUnavailableError,
    ServiceError,
)


class FileController:
    """Controller for file upload, retrieval, renaming and deletion."""

    def __init__(self, service: FileService = file_service):
        self.service = service

    def _handle_service_error(self, exc: ServiceError):
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
        )

    # ---------------------------------------------------------
    # Upload Verification
    # ---------------------------------------------------------

    async def verify_upload(
        self,
        file_id: str,
        user: Any,
    ):
        """Verify a completed S3 upload."""

        try:
            return await self.service.verify_upload(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # ---------------------------------------------------------
    # Version Upload
    # ---------------------------------------------------------

    async def initiate_version_upload(
        self,
        file_id: str,
        data: FileVersionUploadRequest,
        user: Any,
    ) -> FileVersionUploadResponse:
        """Initiate a new version upload."""

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
        data: FileVersionUploadRequest,
        user: Any,
    ):
        """Verify a completed version upload."""

        try:
            return await self.service.verify_version_upload(
                file_id=file_id,
                version_number=version_number,
                user_id=user.id,
                data=data,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)
        """Verify a completed S3 upload."""

        try:
            return await self.service.verify_upload(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)
    
        async def initiate_version_upload(
            self,
            file_id: str,
            data: FileVersionUploadRequest,
            user: Any,
        ) -> FileVersionUploadResponse:
            """Initiate a new version upload."""

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
            data: FileVersionUploadRequest,
            user: Any,
        ):
            """Verify a completed version upload."""

            try:
                return await self.service.verify_version_upload(
                    file_id=file_id,
                    version_number=version_number,
                    user_id=user.id,
                    data=data,
                )

            except ServiceError as exc:
                self._handle_service_error(exc)
        

    # ---------------------------------------------------------
    # Retrieve
    # ---------------------------------------------------------

    async def get_file(
        self,
        file_id: str,
        user: Any,
    ):
        """Retrieve an individual file."""

        try:
            return await self.service.get_file(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # ---------------------------------------------------------
    # List
    # ---------------------------------------------------------

    async def list_files(
        self,
        project_id: str,
        user: Any,
    ):
        """List files belonging to a project."""

        try:
            return await self.service.list_files(
                project_id=project_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # ---------------------------------------------------------
    # Download
    # ---------------------------------------------------------

    async def download_file(
        self,
        file_id: str,
        user: Any,
    ) -> FileDownloadResponse:
        """Generate a temporary download URL."""

        try:
            return await self.service.download_file(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # ---------------------------------------------------------
    # Rename
    # ---------------------------------------------------------

    async def rename_file(
        self,
        file_id: str,
        new_name: str,
        user: Any,
    ):
        """Rename an existing file."""

        try:
            return await self.service.rename_file(
                file_id=file_id,
                user_id=user.id,
                new_name=new_name,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    # ---------------------------------------------------------
    # Delete
    # ---------------------------------------------------------

    async def delete_file(
        self,
        file_id: str,
        user: Any,
    ):

        """Delete a file from S3 and PostgreSQL."""

        try:
            return await self.service.delete_file(
                file_id=file_id,
                user_id=user.id,
            )

        except ServiceError as exc:
            self._handle_service_error(exc)

    async def list_file_versions(self, file_id: str, user_id: str):
        return await self.file_service.list_file_versions(
            file_id=file_id,
            user_id=user_id,
        )
    
    async def download_file_version(
        self,
        file_id: str,
        version_number: int,
        user_id: str,
    ):
        return await self.file_service.download_file_version(
            file_id=file_id,
            version_number=version_number,
            user_id=user_id,
        )

# Shared controller instance
file_controller = FileController()
