
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


class AdminUserItem(BaseModel):
    """A user record displayed in Admin User Management."""

    id: str
    email: str
    platform_role: str
    created_at: datetime


class AdminUserListResponse(BaseModel):
    """Paginated list of platform users."""

    users: list[AdminUserItem]
    total: int
    page: int
    page_size: int


class AdminUserRoleUpdate(BaseModel):
    """Request body for changing a user's platform role."""

    platform_role: str


class AdminUserRoleResponse(BaseModel):
    """Result of a platform role update."""

    id: str
    email: str
    platform_role: str


class AdminProjectOrganization(BaseModel):
    """Organization details displayed in the admin project list."""

    id: str
    name: str


class AdminProjectItem(BaseModel):
    """Project information for platform administrators."""

    id: str
    name: str
    slug: str
    organization_id: str
    organization: AdminProjectOrganization
    created_at: datetime


class AdminProjectListResponse(BaseModel):
    """Paginated platform-wide project listing."""

    projects: list[AdminProjectItem]
    total: int
    page: int
    page_size: int

class AdminOrganizationOption(BaseModel):
    id: str
    name: str


class AdminDocumentItem(BaseModel):
    id: str
    name: str
    original_name: str
    content_type: str
    size: int
    status: str
    current_version: int

    project_id: str
    project_name: str

    organization_id: str
    organization_name: str

    uploaded_by_id: str
    created_at: datetime


class AdminDocumentListResponse(BaseModel):
    documents: list[AdminDocumentItem]
    total: int
    page: int
    page_size: int

class AdminApiKeyItem(BaseModel):
    id: str
    name: str
    key_prefix: str
    key_suffix: str | None = None
    scopes: list[str]

    status: str
    expires_at: datetime | None = None
    last_used_at: datetime | None = None
    revoked_at: datetime | None = None
    created_at: datetime

    project_id: str
    project_name: str

    organization_id: str
    organization_name: str

    created_by_id: str
    created_by_email: str


class AdminApiKeyListResponse(BaseModel):
    api_keys: list[AdminApiKeyItem]
    total: int
    page: int
    page_size: int
