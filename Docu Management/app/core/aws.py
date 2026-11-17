
"""
AWS Configuration
=================
Initializes reusable AWS service clients using Boto3.
"""

import boto3

from app.core.config import settings


# Create AWS session
aws_session = boto3.Session(
    profile_name=settings.AWS_PROFILE,
    region_name=settings.AWS_REGION,
)

# Reusable S3 client
s3_client = aws_session.client("s3")
