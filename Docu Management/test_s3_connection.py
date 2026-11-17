
"""
AWS S3 Connection Test
======================
Verifies connectivity between the application
and the configured AWS S3 bucket.
"""

from app.core.aws import s3_client
from app.core.config import settings


def test_s3_connection():
    try:
        response = s3_client.head_bucket(
            Bucket=settings.AWS_S3_BUCKET
        )

        if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
            print("\nS3 CONNECTION SUCCESSFUL!")
            print(f"Bucket: {settings.AWS_S3_BUCKET}")
            print(f"Region: {settings.AWS_REGION}")

    except Exception as error:
        print("\nS3 CONNECTION FAILED!")
        print(f"Error: {error}")


if __name__ == "__main__":
    test_s3_connection()
