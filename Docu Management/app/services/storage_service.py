"""
Storage Service
===============
Centralized AWS S3 operations.

Responsibilities:
- Generate secure upload URLs.
- Generate secure download URLs.
- Delete stored objects.
- Check whether an object exists.
- Retrieve object metadata.
"""

from botocore.exceptions import ClientError

from app.core.aws import s3_client
from app.core.config import settings

from io import BytesIO
from zipfile import ZipFile, BadZipFile

class StorageService:
    """Handles AWS S3 object storage operations."""

    def __init__(self):
        self.bucket = settings.AWS_S3_BUCKET

        if not self.bucket:
            raise ValueError("AWS_S3_BUCKET is not configured.")

    def generate_upload_url(
        self,
        object_key: str,
        content_type: str,
        expires_in: int = 300,
    ) -> str:
        """
        Generate a temporary URL allowing direct upload to S3.
        """

        return s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

    def generate_download_url(
        self,
        object_key: str,
        expires_in: int = 300,
    ) -> str:
        """
        Generate a temporary URL allowing file download.
        """

        return s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": self.bucket,
                "Key": object_key,
            },
            ExpiresIn=expires_in,
        )

    def delete_file(self, object_key: str) -> None:
        """Delete an object from S3."""

        s3_client.delete_object(
            Bucket=self.bucket,
            Key=object_key,
        )

    def check_file_exists(self, object_key: str) -> bool:
        """Check whether an object exists in S3."""

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

    def get_file_metadata(self, object_key: str) -> dict:
        """Retrieve object metadata from S3."""

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

    def rename_file(
        self,
        old_object_key: str,
        new_object_key: str,
    ) -> None:
        """
        Rename an S3 object by copying it to a new key
        and verifying deletion of the original.
        """

        # Step 1: Copy old object to new key
        s3_client.copy_object(
            Bucket=self.bucket,
            CopySource={
                "Bucket": self.bucket,
                "Key": old_object_key,
            },
            Key=new_object_key,
        )

        # Step 2: Delete old object
        s3_client.delete_object(
            Bucket=self.bucket,
            Key=old_object_key,
        )

        # Step 3: Verify old object is deleted
        try:
            s3_client.head_object(
                Bucket=self.bucket,
                Key=old_object_key,
            )
        except s3_client.exceptions.ClientError as error:
            status_code = error.response["ResponseMetadata"]["HTTPStatusCode"]

            if status_code == 404:
                return

            raise

        raise RuntimeError(
            f"Old S3 object still exists: {old_object_key}"
        )   

    
    def get_file_content(self, object_key: str) -> bytes:
        """Retrieve the actual contents of an S3 object."""

        response = s3_client.get_object(
            Bucket=self.bucket,
            Key=object_key,
        )

        return response["Body"].read()



# Shared service instance
storage_service = StorageService()
