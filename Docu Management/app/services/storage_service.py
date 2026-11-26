
"""
Storage Service
===============
Centralized AWS S3 operations.

Responsibilities:
- Generate secure upload URLs.
- Generate secure download URLs.
- Delete stored objects and their S3 versions.
- Check whether an object exists.
- Retrieve object metadata and contents.
- Copy and rename stored objects.

All synchronous Boto3 operations are executed in worker threads
to prevent blocking FastAPI's asynchronous event loop.
"""

import asyncio

from botocore.exceptions import ClientError

from app.core.aws import s3_client
from app.core.config import settings


class StorageService:
    """Handles AWS S3 object storage operations."""

    def __init__(self):
        self.bucket = settings.AWS_S3_BUCKET

        if not self.bucket:
            raise ValueError("AWS_S3_BUCKET is not configured.")

    # -------------------------------------------------------------------------
    # Upload URL
    # -------------------------------------------------------------------------

    async def generate_upload_url(
        self,
        object_key: str,
        content_type: str,
        expires_in: int = 300,
    ) -> str:
        """Generate a temporary URL allowing direct upload to S3."""

        return await asyncio.to_thread(
            s3_client.generate_presigned_url,
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

    # -------------------------------------------------------------------------
    # Upload File Content (Direct)
    # -------------------------------------------------------------------------

    async def upload_file_content(
        self,
        object_key: str,
        content: bytes,
        content_type: str,
    ) -> None:
        """Upload raw bytes directly to S3."""
        await asyncio.to_thread(
            self._upload_file_content_sync,
            object_key,
            content,
            content_type,
        )

    def _upload_file_content_sync(
        self,
        object_key: str,
        content: bytes,
        content_type: str,
    ) -> None:
        """Synchronous implementation of direct S3 upload."""
        s3_client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=content,
            ContentType=content_type,
        )

    # -------------------------------------------------------------------------
    # Download URL
    # -------------------------------------------------------------------------

    async def generate_download_url(
        self,
        object_key: str,
        expires_in: int = 300,
    ) -> str:
        """Generate a temporary URL allowing file download."""

        return await asyncio.to_thread(
            s3_client.generate_presigned_url,
            ClientMethod="get_object",
            Params={
                "Bucket": self.bucket,
                "Key": object_key,
            },
            ExpiresIn=expires_in,
        )

    # -------------------------------------------------------------------------
    # Delete Object
    # -------------------------------------------------------------------------

    async def delete_file(self, object_key: str) -> None:
        """
        Permanently delete an object from S3.

        If bucket versioning is enabled or suspended, all versions
        and delete markers belonging to this exact object key are removed.
        """

        await asyncio.to_thread(
            self._delete_file_sync,
            object_key,
        )

    def _delete_file_sync(self, object_key: str) -> None:
        """Synchronous implementation of permanent S3 object deletion."""

        versioning = s3_client.get_bucket_versioning(
            Bucket=self.bucket,
        )

        versioning_status = versioning.get("Status")

        # Versioning has never been enabled.
        if versioning_status not in ("Enabled", "Suspended"):
            s3_client.delete_object(
                Bucket=self.bucket,
                Key=object_key,
            )
            return

        # Bucket versioning is enabled or suspended.
        # Find every version and delete marker for this exact key.
        paginator = s3_client.get_paginator("list_object_versions")

        objects_to_delete = []

        for page in paginator.paginate(
            Bucket=self.bucket,
            Prefix=object_key,
        ):
            for version in page.get("Versions", []):
                if version["Key"] == object_key:
                    objects_to_delete.append({
                        "Key": object_key,
                        "VersionId": version["VersionId"],
                    })

            for marker in page.get("DeleteMarkers", []):
                if marker["Key"] == object_key:
                    objects_to_delete.append({
                        "Key": object_key,
                        "VersionId": marker["VersionId"],
                    })

        # No versions or delete markers exist.
        if not objects_to_delete:
            return

        # S3 DeleteObjects accepts a maximum of 1000 objects per request.
        for start in range(0, len(objects_to_delete), 1000):
            batch = objects_to_delete[start:start + 1000]

            response = s3_client.delete_objects(
                Bucket=self.bucket,
                Delete={
                    "Objects": batch,
                    "Quiet": True,
                },
            )

            errors = response.get("Errors", [])

            if errors:
                raise RuntimeError(
                    f"Failed to permanently delete some S3 object versions: "
                    f"{errors}"
                )

    # -------------------------------------------------------------------------
    # Check Object
    # -------------------------------------------------------------------------

    async def check_file_exists(self, object_key: str) -> bool:
        """Check whether an object exists in S3."""

        return await asyncio.to_thread(
            self._check_file_exists_sync,
            object_key,
        )

    def _check_file_exists_sync(self, object_key: str) -> bool:
        """Synchronous implementation of the object existence check."""

        try:
            s3_client.head_object(
                Bucket=self.bucket,
                Key=object_key,
            )
            return True

        except ClientError as error:
            error_code = error.response.get(
                "Error", {}
            ).get("Code")

            if error_code in ("404", "NoSuchKey", "NotFound"):
                return False

            raise

    # -------------------------------------------------------------------------
    # Object Metadata
    # -------------------------------------------------------------------------

    async def get_file_metadata(self, object_key: str) -> dict:
        """Retrieve object metadata from S3."""

        return await asyncio.to_thread(
            self._get_file_metadata_sync,
            object_key,
        )

    def _get_file_metadata_sync(self, object_key: str) -> dict:
        """Synchronous implementation of metadata retrieval."""

        response = s3_client.head_object(
            Bucket=self.bucket,
            Key=object_key,
        )

        return {
            "file_size": response["ContentLength"],
            "content_type": response.get("ContentType"),
            "last_modified": response.get("LastModified"),
            "etag": response.get("ETag"),
        }

    # -------------------------------------------------------------------------
    # File Content
    # -------------------------------------------------------------------------

    async def get_file_content(self, object_key: str) -> bytes:
        """Retrieve the actual contents of an S3 object."""

        return await asyncio.to_thread(
            self._get_file_content_sync,
            object_key,
        )

    def _get_file_content_sync(self, object_key: str) -> bytes:
        """Synchronous implementation of file content retrieval."""

        response = s3_client.get_object(
            Bucket=self.bucket,
            Key=object_key,
        )

        body = response["Body"]

        try:
            return body.read()
        finally:
            body.close()

    # -------------------------------------------------------------------------
    # Copy Object
    # -------------------------------------------------------------------------

    async def copy_file(
        self,
        source_object_key: str,
        destination_object_key: str,
    ) -> dict:
        """Copy an existing S3 object to a new object key."""

        return await asyncio.to_thread(
            self._copy_file_sync,
            source_object_key,
            destination_object_key,
        )

    def _copy_file_sync(
        self,
        source_object_key: str,
        destination_object_key: str,
    ) -> dict:
        """Synchronous implementation of the S3 copy operation."""

        return s3_client.copy_object(
            Bucket=self.bucket,
            CopySource={
                "Bucket": self.bucket,
                "Key": source_object_key,
            },
            Key=destination_object_key,
        )

    # -------------------------------------------------------------------------
    # Rename Object
    # -------------------------------------------------------------------------

    async def rename_file(
        self,
        old_object_key: str,
        new_object_key: str,
    ) -> None:
        """
        Rename an S3 object using copy followed by deletion.

        Note:
        S3 does not provide an atomic rename operation.
        If deletion of the original object fails, the copied object
        remains in S3 so that the data is not accidentally lost.
        """

        # Step 1: Copy the original object.
        await self.copy_file(
            source_object_key=old_object_key,
            destination_object_key=new_object_key,
        )

        # Step 2: Delete the original object.
        await self.delete_file(old_object_key)


# -----------------------------------------------------------------------------
# Shared Service Instance
# -----------------------------------------------------------------------------

storage_service = StorageService()
