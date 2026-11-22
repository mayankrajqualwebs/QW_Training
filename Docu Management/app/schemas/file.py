
"""
File Schemas
============
Pydantic schemas for file management requests and responses.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field



class FileUploadRequest(BaseModel):
    """Request data required to initiate a file upload."""

    name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=150)
    size: int = Field(
        gt=0,
        le=10 * 1024 * 1024,
        description="Maximum allowed file size is 10 MB.",
    )



class FileUploadResponse(BaseModel):
    """Response containing temporary upload URL and file information."""

    file_id: str
    object_key: str
    upload_url: str
    expires_in: int


class FileResponse(BaseModel):
    """File information returned by the API."""

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

    model_config = ConfigDict(from_attributes=True)


class FileDownloadResponse(BaseModel):
    """Response containing a temporary download URL."""

    file_id: str
    download_url: str
    expires_in: int


class FileRenameRequest(BaseModel):
    """Request data for renaming a file."""

    new_name: str = Field(min_length=1, max_length=255)


class FileVersionUploadRequest(BaseModel):
    """Request data for uploading a new document version."""

    content_type: str = Field(min_length=1, max_length=150)
    size: int = Field(
        gt=0,
        le=10 * 1024 * 1024,
        description="Maximum allowed file size is 10 MB.",
    )


class FileVersionUploadResponse(BaseModel):
    """Response containing temporary upload URL and version information."""

    file_id: str
    version_number: int
    object_key: str
    upload_url: str
    expires_in: int


class FileVersionResponse(BaseModel):
    """Information about an individual file version."""

    id: str
    versionNumber: int
    contentType: str
    size: int
    uploadedById: str
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
