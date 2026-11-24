
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AdminOverviewResponse(BaseModel):
    """Platform-wide statistics for the Admin Overview dashboard."""

    total_users: int
    total_organizations: int
    total_projects: int
    total_documents: int
    uploaded_documents: int
    active_api_keys: int
    total_api_requests: int

    model_config = ConfigDict(from_attributes=True)

class AdminRecentUser(BaseModel):
    id: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminRecentDocument(BaseModel):
    id: str
    name: str
    original_name: str
    content_type: str
    size: int
    created_at: datetime
    project_name: str
    uploaded_by_email: str

    model_config = ConfigDict(from_attributes=True)


class AdminRecentRequest(BaseModel):
    id: str
    method: str
    path: str
    status_code: int
    latency_ms: int
    created_at: datetime
    project_name: str

    model_config = ConfigDict(from_attributes=True)


class AdminActivityResponse(BaseModel):
    recent_users: list[AdminRecentUser]
    recent_documents: list[AdminRecentDocument]
    recent_requests: list[AdminRecentRequest]
