
"""
File Schemas
============
Defines request and response models for project file management,
including uploads, downloads, versioning, and restoration.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------
# Supported File Types
# ---------------------------------------------------------------------

PDF_CONTENT_TYPE = "application/pdf"

DOCX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument."
    "wordprocessingml.document"
)

AllowedContentType = Literal[
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# ---------------------------------------------------------------------
# File Upload
# ---------------------------------------------------------------------

class FileUploadRequest(BaseModel):
    """Request model for initiating a new file upload."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    content_type: AllowedContentType

    size: int = Field(
        ...,
        gt=0,
        le=MAX_FILE_SIZE,
    )


class FileUploadResponse(BaseModel):
    """Response containing the presigned S3 upload URL."""

    file_id: str
    object_key: str
    upload_url: str
    expires_in: int


# ---------------------------------------------------------------------
# File Upload Verification
# ---------------------------------------------------------------------

class FileUploadVerifyRequest(BaseModel):
    """Request model for verifying an uploaded file."""

    object_key: str

    content_type: AllowedContentType

    size: int = Field(
        ...,
        gt=0,
        le=MAX_FILE_SIZE,
    )


# ---------------------------------------------------------------------
# File Information
# ---------------------------------------------------------------------

class FileResponse(BaseModel):
    """Response model representing a project file."""

    id: str
    name: str
    originalName: str
    contentType: str
    size: int
    status: str
    projectId: str
    uploadedById: str
    createdAt: datetime
    updatedAt: datetime

    # Derived from the related FileVersion records.
    totalVersions: int

    model_config = ConfigDict(
        from_attributes=True,
    )


# ---------------------------------------------------------------------
# File Download
# ---------------------------------------------------------------------

class FileDownloadResponse(BaseModel):
    """Response containing a presigned S3 download URL."""

    file_id: str
    download_url: str
    expires_in: int

    # Populated when downloading a specific historical version.
    version_number: int | None = None


# ---------------------------------------------------------------------
# File Rename
# ---------------------------------------------------------------------

class FileRenameRequest(BaseModel):
    """Request model for renaming a file."""

    new_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )


# ---------------------------------------------------------------------
# File Version Upload
# ---------------------------------------------------------------------

class FileVersionUploadRequest(BaseModel):
    """Request model for initiating a new file version upload."""

    content_type: AllowedContentType

    size: int = Field(
        ...,
        gt=0,
        le=MAX_FILE_SIZE,
    )


class FileVersionUploadResponse(BaseModel):
    """Response containing the presigned URL for a new version."""

    file_id: str
    version_number: int
    object_key: str
    upload_url: str
    expires_in: int


# ---------------------------------------------------------------------
# File Version Upload Verification
# ---------------------------------------------------------------------

class FileVersionVerifyRequest(BaseModel):
    """Request model for verifying an uploaded file version."""

    object_key: str

    content_type: AllowedContentType

    size: int = Field(
        ...,
        gt=0,
        le=MAX_FILE_SIZE,
    )


# ---------------------------------------------------------------------
# File Version Information
# ---------------------------------------------------------------------

class FileVersionResponse(BaseModel):
    """Response model representing a stored file version."""

    id: str
    versionNumber: int
    contentType: str
    size: int
    uploadedById: str
    createdAt: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ---------------------------------------------------------------------
# File Version Restoration
# ---------------------------------------------------------------------

class FileVersionRestoreResponse(BaseModel):
    """Response returned after restoring a historical file version."""

    file_id: str
    restored_from_version: int
    new_version_number: int
    message: str
