
"""
Files API Router
================
Defines HTTP routes for managing files stored in AWS S3
and associated with projects.
Delegates request execution to FileController.
"""

from fastapi import APIRouter, Depends, status

from app.controllers.file_controller import file_controller
from app.core.dependencies import get_current_user

from app.schemas.file import (
    FileUploadRequest,
    FileUploadResponse,
    FileResponse,
    FileDownloadResponse,
    FileRenameRequest,
    FileVersionUploadRequest,
    FileVersionUploadResponse,
    FileVersionVerifyRequest,
    FileVersionResponse,
    FileVersionRestoreResponse,
)


router = APIRouter(tags=["Files"])


# -----------------------------------------------------------------------------
# File Upload
# -----------------------------------------------------------------------------

@router.post(
    "/projects/{project_id}/files",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    project_id: str,
    data: FileUploadRequest,
    user=Depends(get_current_user),
):
    """Initiates a file upload and returns a presigned S3 upload URL."""

    return await file_controller.upload_file(
        project_id=project_id,
        data=data,
        user=user,
    )


@router.post(
    "/files/{file_id}/verify",
    response_model=FileResponse,
)
async def verify_upload(
    file_id: str,
    user=Depends(get_current_user),
):
    """Verifies that the file was successfully uploaded to S3."""

    return await file_controller.verify_upload(
        file_id=file_id,
        user=user,
    )


# -----------------------------------------------------------------------------
# File Version Upload
# -----------------------------------------------------------------------------

@router.post(
    "/files/{file_id}/versions",
    response_model=FileVersionUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_version_upload(
    file_id: str,
    data: FileVersionUploadRequest,
    user=Depends(get_current_user),
):
    """Initiates a new file version upload."""

    return await file_controller.initiate_version_upload(
        file_id=file_id,
        data=data,
        user=user,
    )


@router.post(
    "/files/{file_id}/versions/{version_number}/verify",
    response_model=FileResponse,
)
async def verify_version_upload(
    file_id: str,
    version_number: int,
    data: FileVersionVerifyRequest,
    user=Depends(get_current_user),
):
    """Verifies and finalizes a new file version."""

    return await file_controller.verify_version_upload(
        file_id=file_id,
        version_number=version_number,
        data=data,
        user=user,
    )


# -----------------------------------------------------------------------------
# File Retrieval
# -----------------------------------------------------------------------------

@router.get(
    "/projects/{project_id}/files",
    response_model=list[FileResponse],
)
async def list_files(
    project_id: str,
    user=Depends(get_current_user),
):
    """Lists files belonging to a project."""

    return await file_controller.list_files(
        project_id=project_id,
        user=user,
    )


@router.get(
    "/files/{file_id}",
    response_model=FileResponse,
)
async def get_file(
    file_id: str,
    user=Depends(get_current_user),
):
    """Retrieves file metadata."""

    return await file_controller.get_file(
        file_id=file_id,
        user=user,
    )


# -----------------------------------------------------------------------------
# File Download
# -----------------------------------------------------------------------------

@router.get(
    "/files/{file_id}/download",
    response_model=FileDownloadResponse,
)
async def download_file(
    file_id: str,
    user=Depends(get_current_user),
):
    """Generates a temporary presigned S3 download URL."""

    return await file_controller.download_file(
        file_id=file_id,
        user=user,
    )


# -----------------------------------------------------------------------------
# File Management
# -----------------------------------------------------------------------------

@router.patch(
    "/files/{file_id}/rename",
    response_model=FileResponse,
)
async def rename_file(
    file_id: str,
    data: FileRenameRequest,
    user=Depends(get_current_user),
):
    """Renames a file's display name."""

    return await file_controller.rename_file(
        file_id=file_id,
        new_name=data.new_name,
        user=user,
    )


@router.delete(
    "/files/{file_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_file(
    file_id: str,
    user=Depends(get_current_user),
):
    """Deletes a file and its associated versions."""

    return await file_controller.delete_file(
        file_id=file_id,
        user=user,
    )


# -----------------------------------------------------------------------------
# File Version Management
# -----------------------------------------------------------------------------

@router.get(
    "/files/{file_id}/versions",
    response_model=list[FileVersionResponse],
)
async def list_file_versions(
    file_id: str,
    user=Depends(get_current_user),
):
    """Lists all versions of an authorized file."""

    return await file_controller.list_file_versions(
        file_id=file_id,
        user=user,
    )


@router.get(
    "/files/{file_id}/versions/{version_number}/download",
    response_model=FileDownloadResponse,
)
async def download_file_version(
    file_id: str,
    version_number: int,
    user=Depends(get_current_user),
):
    """Generates a download URL for a specific file version."""

    return await file_controller.download_file_version(
        file_id=file_id,
        version_number=version_number,
        user=user,
    )


@router.post(
    "/files/{file_id}/versions/{version_number}/restore",
    response_model=FileVersionRestoreResponse,
)
async def restore_file_version(
    file_id: str,
    version_number: int,
    user=Depends(get_current_user),
):
    """Restores an earlier version as a new file version."""

    return await file_controller.restore_file_version(
        file_id=file_id,
        version_number=version_number,
        user=user,
    )
