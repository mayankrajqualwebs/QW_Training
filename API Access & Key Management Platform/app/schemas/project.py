"""
Project Data Schemas
====================
Defines Pydantic request and response models for projects.

Projects represent distinct applications within an organization. Each project
has its own API keys and request logs. Used by `app/api/projects.py`.
"""

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    """Payload received when creating a new project within an organization."""
    name: str = Field(
        min_length=2,
        max_length=100,
        description="Display name of the project (e.g. Mobile API).",
    )
    slug: str = Field(
        min_length=2,
        max_length=50,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="URL-friendly identifier, unique per organization (e.g. mobile-api).",
    )


class ProjectResponse(BaseModel):
    """Project record returned to the client."""
    id: str
    name: str
    slug: str
    organization_id: str
