"""
Analytics Service
=================
Business logic for computing usage metrics, latency statistics, and error distributions.
"""

from datetime import datetime, timedelta, timezone

from app.repositories.membership_repository import (
    MembershipRepository,
    membership_repository,
)
from app.repositories.project_repository import (
    ProjectRepository,
    project_repository,
)
from app.repositories.request_log_repository import (
    RequestLogRepository,
    request_log_repository,
)
from app.schemas.analytics import UsageSummary
from app.services.exceptions import NotFoundError


class AnalyticsService:
    """Service handling metrics aggregation and telemetry processing."""

    def __init__(
        self,
        request_log_repo: RequestLogRepository = request_log_repository,
        membership_repo: MembershipRepository = membership_repository,
        project_repo: ProjectRepository = project_repository,
    ):
        self.request_log_repo = request_log_repo
        self.membership_repo = membership_repo
        self.project_repo = project_repo

    async def verify_project_access(
        self,
        organization_id: str,
        project_id: str,
        user_id: str,
    ) -> None:
        """Ensures user belongs to organization and project exists within that organization."""
        membership = await self.membership_repo.get_by_user_and_org(
            user_id=user_id,
            organization_id=organization_id,
        )
        if membership is None:
            raise NotFoundError("Organization not found")

        project = await self.project_repo.get_by_id(project_id)
        if project is None or project.organizationId != organization_id:
            raise NotFoundError("Project not found")

    async def get_usage_summary(
        self,
        organization_id: str,
        project_id: str,
        user_id: str,
        days: int = 7,
    ) -> UsageSummary:
        """Computes aggregated usage metrics over the requested sliding time window."""
        await self.verify_project_access(
            organization_id=organization_id,
            project_id=project_id,
            user_id=user_id,
        )

        since = datetime.now(timezone.utc) - timedelta(days=days)
        logs = await self.request_log_repo.list_by_project_since(
            project_id=project_id,
            since=since,
        )

        total = len(logs)
        successful = sum(
            1 for log in logs if 200 <= log.statusCode < 400
        )
        errors = sum(
            1 for log in logs if log.statusCode >= 400
        )

        average_latency = (
            sum(log.latencyMs for log in logs) / total
            if total
            else 0.0
        )

        breakdown: dict[str, int] = {}
        for log in logs:
            code = str(log.statusCode)
            breakdown[code] = breakdown.get(code, 0) + 1

        error_rate = errors / total * 100 if total else 0.0

        return UsageSummary(
            project_id=project_id,
            period_days=days,
            total_requests=total,
            successful_requests=successful,
            error_requests=errors,
            average_latency_ms=round(average_latency, 2),
            error_rate_percent=round(error_rate, 2),
            status_code_breakdown=breakdown,
        )


analytics_service = AnalyticsService()
