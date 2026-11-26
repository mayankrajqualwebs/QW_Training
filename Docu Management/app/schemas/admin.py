
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

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


class AdminUserCreateRequest(BaseModel):
    """Request body for creating a new platform user via Admin Console."""

    email: EmailStr
    password: str = Field(
        min_length=12,
        max_length=128,
        description="User password, enforced to at least 12 characters for security.",
    )
    platform_role: str = Field(
        default="USER",
        description="Platform role for the user: USER or ADMIN.",
    )


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
    slug: str | None = None


class AdminOrganizationCreateRequest(BaseModel):
    """Payload received when creating a new organization via Admin Console."""

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


class AdminProjectCreateRequest(BaseModel):
    """Payload received when creating a new project via Admin Console."""

    organization_id: str = Field(
        ...,
        description="ID of the organization to which the project belongs.",
    )
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
    uploaded_by_email: str | None = None
    created_at: datetime


class AdminDocumentListResponse(BaseModel):
    documents: list[AdminDocumentItem]
    total: int
    page: int
    page_size: int


class AdminDocumentVersionItem(BaseModel):
    id: str
    version_number: int
    size: int
    content_type: str
    created_at: datetime
    uploaded_by_id: str
    uploaded_by_email: str | None = None


class AdminDocumentDetailResponse(BaseModel):
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
    uploaded_by_email: str | None = None
    created_at: datetime
    updated_at: datetime
    versions: list[AdminDocumentVersionItem] = []


class AdminDocumentUpdateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255,
        description="Updated display name of the document.",
    )


class AdminDocumentDownloadResponse(BaseModel):
    download_url: str
    filename: str
    expires_in: int = 300

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


class AdminMonitoringSummary(BaseModel):
    days: int
    total_requests: int
    successful_requests: int
    failed_requests: int
    error_rate: float
    average_latency_ms: float


class AdminMonitoringRequestItem(BaseModel):
    id: str
    method: str
    path: str
    status_code: int
    latency_ms: int
    created_at: datetime

    project_id: str
    project_name: str

    organization_id: str
    organization_name: str

    api_key_id: str | None = None
    api_key_name: str | None = None
    api_key_prefix: str | None = None


class AdminMonitoringRequestListResponse(BaseModel):
    requests: list[AdminMonitoringRequestItem]
    total: int
    page: int
    page_size: int
