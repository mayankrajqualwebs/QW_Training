
"""
AWS Configuration
=================
Initializes reusable AWS service clients using Boto3.
"""

import os
import boto3

from app.core.config import settings


# Create AWS session
try:
    aws_session = boto3.Session(
        profile_name=settings.AWS_PROFILE,
        region_name=settings.AWS_REGION,
    )
    s3_client = aws_session.client("s3")
except Exception:
    # Fallback when specified AWS_PROFILE does not exist locally
    orig_profile = os.environ.pop("AWS_PROFILE", None)
    try:
        aws_session = boto3.Session(
            region_name=settings.AWS_REGION,
        )
        s3_client = aws_session.client("s3")
    except Exception:
        aws_session = boto3.Session()
        s3_client = aws_session.client("s3", region_name=settings.AWS_REGION or "us-east-1")
    finally:
        if orig_profile is not None:
            os.environ["AWS_PROFILE"] = orig_profile
