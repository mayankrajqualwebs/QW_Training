
import { useCallback, useEffect, useState } from "react";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    RefreshCw,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { adminService } from "../services/adminService";

const PAGE_SIZE = 20;

function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-IN");
}

function StatusBadge({ status }) {
    let className = "monitoring-status";

    if (status >= 200 && status < 400) {
        className += " monitoring-status-success";
    } else if (status >= 400) {
        className += " monitoring-status-error";
    }

    return (
        <span className={className}>
            {status}
        </span>
    );
}

function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    className = "",
}) {
    return (
        <article className={`monitoring-metric ${className}`}>
            <div className="monitoring-metric-top">
                <span>{title}</span>
                <Icon size={19} />
            </div>

            <strong>{value}</strong>

            <p>{description}</p>
        </article>
    );
}

export default function AdminMonitoringPage() {
    const [summary, setSummary] = useState(null);
    const [requests, setRequests] = useState([]);

    const [organizations, setOrganizations] = useState([]);
    const [projects, setProjects] = useState([]);

    const [organizationId, setOrganizationId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [days, setDays] = useState(7);
    const [method, setMethod] = useState("");
    const [statusCategory, setStatusCategory] = useState("");
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadFilters = useCallback(async () => {
        try {
            const [organizationResult, projectResult] =
                await Promise.all([
                    adminService.getOrganizations(),
                    adminService.getProjects({
                        page: 1,
                        page_size: 100,
                    }),
                ]);

            setOrganizations(
                Array.isArray(organizationResult)
                    ? organizationResult
                    : []
            );

            setProjects(
                projectResult?.projects || []
            );
        } catch (err) {
            console.error(
                "Failed to load monitoring filters:",
                err
            );
        }
    }, []);

    const loadMonitoring = useCallback(
        async (showRefresh = false) => {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const requestParams = {
                    days,
                    page,
                    page_size: PAGE_SIZE,
                    search: search.trim() || undefined,
                    organization_id:
                        organizationId || undefined,
                    project_id: projectId || undefined,
                    method: method || undefined,
                    status_category:
                        statusCategory || undefined,
                };

                const [summaryResult, requestResult] =
                    await Promise.all([
                        adminService.getMonitoringSummary(days),
                        adminService.getMonitoringRequests(
                            requestParams
                        ),
                    ]);

                setSummary(summaryResult);
                setRequests(
                    requestResult?.requests || []
                );
                setTotal(requestResult?.total || 0);
            } catch (err) {
                console.error(
                    "Failed to load API monitoring:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load API monitoring data."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            days,
            page,
            search,
            organizationId,
            projectId,
            method,
            statusCategory,
        ]
    );

    useEffect(() => {
        loadFilters();
    }, [loadFilters]);

    useEffect(() => {
        loadMonitoring();
    }, [loadMonitoring]);

    const handleOrganizationChange = (value) => {
        setOrganizationId(value);
        setProjectId("");
        setPage(1);
    };

    const handleFilterChange = (setter, value) => {
        setter(value);
        setPage(1);
    };

    const filteredProjects = organizationId
        ? projects.filter(
            (project) =>
                project.organization_id === organizationId
        )
        : projects;

    const totalPages = Math.max(
        1,
        Math.ceil(total / PAGE_SIZE)
    );

    return (
        <div className="admin-monitoring-page">
            <div className="monitoring-page-header">
                <div>
                    <h1>API Monitoring</h1>
                    <p>
                        Monitor platform API traffic,
                        performance, and errors.
                    </p>
                </div>

                <div className="monitoring-header-actions">
                    <select
                        value={days}
                        onChange={(event) => {
                            setDays(Number(event.target.value));
                            setPage(1);
                        }}
                        aria-label="Time range"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                    </select>

                    <button
                        type="button"
                        className="monitoring-refresh-button"
                        onClick={() => loadMonitoring(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "monitoring-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="monitoring-error">
                    <AlertTriangle size={18} />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => loadMonitoring(true)}
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="monitoring-metrics-grid">
                <MetricCard
                    title="Total Requests"
                    value={formatNumber(summary?.total_requests)}
                    description={`Across the last ${days} days`}
                    icon={Activity}
                />

                <MetricCard
                    title="Successful Requests"
                    value={formatNumber(
                        summary?.successful_requests
                    )}
                    description="HTTP 2xx and 3xx responses"
                    icon={CheckCircle2}
                    className="monitoring-metric-success"
                />

                <MetricCard
                    title="Failed Requests"
                    value={formatNumber(
                        summary?.failed_requests
                    )}
                    description="HTTP 4xx and 5xx responses"
                    icon={AlertTriangle}
                    className="monitoring-metric-error"
                />

                <MetricCard
                    title="Error Rate"
                    value={`${summary?.error_rate ?? 0}%`}
                    description="Failed requests / total requests"
                    icon={Activity}
                />

                <MetricCard
                    title="Average Latency"
                    value={`${summary?.average_latency_ms ?? 0} ms`}
                    description="Average request processing time"
                    icon={Clock3}
                />
            </div>

            <section className="monitoring-requests-panel">
                <div className="monitoring-table-header">
                    <div>
                        <h2>Request Activity</h2>
                        <p>
                            {formatNumber(total)} matching requests
                        </p>
                    </div>
                </div>

                <div className="monitoring-filters">
                    <div className="monitoring-search">
                        <Search size={16} />

                        <input
                            type="search"
                            placeholder="Search endpoint or method..."
                            value={search}
                            onChange={(event) => {
                                handleFilterChange(
                                    setSearch,
                                    event.target.value
                                );
                            }}
                        />
                    </div>

                    <select
                        value={organizationId}
                        onChange={(event) =>
                            handleOrganizationChange(
                                event.target.value
                            )
                        }
                    >
                        <option value="">All organizations</option>

                        {organizations.map((organization) => (
                            <option
                                key={organization.id}
                                value={organization.id}
                            >
                                {organization.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={projectId}
                        onChange={(event) =>
                            handleFilterChange(
                                setProjectId,
                                event.target.value
                            )
                        }
                    >
                        <option value="">All projects</option>

                        {filteredProjects.map((project) => (
                            <option
                                key={project.id}
                                value={project.id}
                            >
                                {project.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={method}
                        onChange={(event) =>
                            handleFilterChange(
                                setMethod,
                                event.target.value
                            )
                        }
                    >
                        <option value="">All methods</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                    </select>

                    <select
                        value={statusCategory}
                        onChange={(event) =>
                            handleFilterChange(
                                setStatusCategory,
                                event.target.value
                            )
                        }
                    >
                        <option value="">All statuses</option>
                        <option value="success">Successful</option>
                        <option value="error">Failed</option>
                    </select>
                </div>

                <div className="monitoring-table-wrapper">
                    <table className="monitoring-table">
                        <thead>
                            <tr>
                                <th>Request</th>
                                <th>Status</th>
                                <th>Latency</th>
                                <th>Project</th>
                                <th>API Key</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="monitoring-empty"
                                    >
                                        Loading request activity...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="monitoring-empty"
                                    >
                                        No request logs found for
                                        the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <div className="monitoring-request-cell">
                                                <span
                                                    className={`monitoring-method monitoring-method-${request.method.toLowerCase()}`}
                                                >
                                                    {request.method}
                                                </span>

                                                <code>
                                                    {request.path}
                                                </code>
                                            </div>
                                        </td>

                                        <td>
                                            <StatusBadge
                                                status={request.status_code}
                                            />
                                        </td>

                                        <td>
                                            <span className="monitoring-latency">
                                                {request.latency_ms} ms
                                            </span>
                                        </td>

                                        <td>
                                            <div className="monitoring-project-cell">
                                                <strong>
                                                    {request.project_name}
                                                </strong>
                                                <span>
                                                    {request.organization_name}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="monitoring-key-cell">
                                                {request.api_key_name ? (
                                                    <>
                                                        <strong>
                                                            {request.api_key_name}
                                                        </strong>
                                                        <code>
                                                            {request.api_key_prefix}
                                                        </code>
                                                    </>
                                                ) : (
                                                    <span>Unidentified</span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span className="monitoring-date">
                                                {formatDate(
                                                    request.created_at
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="monitoring-pagination">
                    <span>
                        Page {page} of {totalPages}
                    </span>

                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                setPage((current) =>
                                    Math.max(1, current - 1)
                                )
                            }
                            disabled={page <= 1 || loading}
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={17} />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(
                                        totalPages,
                                        current + 1
                                    )
                                )
                            }
                            disabled={
                                page >= totalPages || loading
                            }
                            aria-label="Next page"
                        >
                            <ChevronRight size={17} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
