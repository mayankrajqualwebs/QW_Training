"""
Organization Data Schemas
=========================
Defines Pydantic request and response models for organizations.

Organizations serve as multi-tenant boundaries that own projects and team memberships.
Used by `app/api/organizations.py`.
"""

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    """Payload received when creating a new organization."""
    name: str = Field(
        min_length=2,
        max_length=100,
        description="Display name of the organization (e.g. Acme Corp).",
    )
    slug: str = Field(
        min_length=2,
        max_length=50,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="URL-friendly unique identifier (e.g. acme-corp).",
    )


class OrganizationResponse(BaseModel):
    """
    Representation of an organization returned to the client.
    Includes the calling user's membership role (e.g. OWNER, ADMIN, DEVELOPER, VIEWER).
    """
    id: str
    name: str
    slug: str
    role: str
