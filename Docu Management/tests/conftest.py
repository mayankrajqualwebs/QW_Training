
import os

import pytest
from dotenv import dotenv_values

# Read database URLs from the project .env file.
env_values = dotenv_values(".env")

test_database_url = env_values.get("TEST_DATABASE_URL")
development_database_url = env_values.get("DATABASE_URL")

# Fail safely if the test database is not configured correctly.
if not test_database_url:
    raise RuntimeError("TEST_DATABASE_URL is missing from .env")

if not development_database_url:
    raise RuntimeError("DATABASE_URL is missing from .env")

if test_database_url == development_database_url:
    raise RuntimeError(
        "Test and development database URLs must be different!"
    )

# Override DATABASE_URL for this pytest process only.
os.environ["DATABASE_URL"] = test_database_url

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Start the FastAPI application for an integration test."""
    with TestClient(app) as test_client:
        yield test_client
