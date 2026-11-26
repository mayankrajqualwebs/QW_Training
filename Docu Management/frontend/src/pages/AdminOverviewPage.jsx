
import { useEffect, useState } from "react";
import {
    Users,
    Building2,
    FolderKanban,
    FileText,
    KeyRound,
    Activity,
} from "lucide-react";

import { Metric } from "../components/Metric";
import { Alert } from "../components/Alert";
import { adminService } from "../services/adminService";

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatBytes(bytes) {
    if (bytes === undefined || bytes === null) return "—";
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function ActivityEmpty({ message }) {
    return (
        <div className="admin-activity-empty">
            {message}
        </div>
    );
}

export function AdminOverviewPage() {
    const [overview, setOverview] = useState(null);
    const [activity, setActivity] = useState(null);

    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(true);

    const [overviewError, setOverviewError] = useState("");
    const [activityError, setActivityError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadDashboard() {
            try {
                const data = await adminService.getOverview();

                if (isMounted) {
                    setOverview(data);
                }
            } catch (err) {
                if (isMounted) {
                    setOverviewError(
                        err.response?.data?.detail ||
                        "Unable to load platform statistics."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoadingOverview(false);
                }
            }

            try {
                const data = await adminService.getActivity();

                if (isMounted) {
                    setActivity(data);
                }
            } catch (err) {
                if (isMounted) {
                    setActivityError(
                        err.response?.data?.detail ||
                        "Unable to load recent platform activity."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoadingActivity(false);
                }
            }
        }

        loadDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    const metrics = [
        {
            title: "Total Users",
            value: overview?.total_users,
            icon: <Users />,
        },
        {
            title: "Organizations",
            value: overview?.total_organizations,
            icon: <Building2 />,
        },
        {
            title: "Total Projects",
            value: overview?.total_projects,
            icon: <FolderKanban />,
        },
        {
            title: "Total Documents",
            value: overview?.total_documents,
            icon: <FileText />,
        },
        {
            title: "Active API Keys",
            value: overview?.active_api_keys,
            icon: <KeyRound />,
        },
        {
            title: "API Requests",
            value: overview?.total_api_requests,
            icon: <Activity />,
        },
    ];

    return (
        <div className="admin-overview">

            {/* Platform Statistics */}
            {overviewError && (
                <Alert type="error" message={overviewError} />
            )}

            <section className="admin-metrics-grid">
                {metrics.map((metric) => (
                    <Metric
                        key={metric.title}
                        title={metric.title}
                        value={
                            loadingOverview
                                ? undefined
                                : metric.value
                        }
                        icon={metric.icon}
                        note={
                            loadingOverview
                                ? "Loading..."
                                : metric.title === "API Requests"
                                    ? "Recorded protected API requests"
                                    : "Platform-wide total"
                        }
                    />
                ))}
            </section>

            {/* Document Storage */}
            <section className="admin-overview-section">
                <div className="admin-section-heading">
                    <div>
                        <h2>Document Storage</h2>
                        <p>Successfully uploaded documents</p>
                    </div>
                </div>

                <div className="admin-storage-card">
                    <span>Uploaded Documents</span>

                    <strong>
                        {loadingOverview
                            ? "—"
                            : (overview?.uploaded_documents ?? 0).toLocaleString()}
                    </strong>

                    <span>
                        Out of {loadingOverview
                            ? "—"
                            : (overview?.total_documents ?? 0).toLocaleString()}
                        {" "}total document records
                    </span>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="admin-activity-section">
                <div className="admin-section-heading">
                    <div>
                        <h2>Recent Activity</h2>
                        <p>Latest activity across your platform</p>
                    </div>
                </div>

                {activityError && (
                    <Alert type="error" message={activityError} />
                )}

                <div className="admin-activity-grid">

                    {/* Recent Users */}
                    <div className="admin-activity-card">
                        <div className="admin-activity-card-heading">
                            <Users size={19} />
                            <h3>Recent Users</h3>
                        </div>

                        {loadingActivity ? (
                            <ActivityEmpty message="Loading users..." />
                        ) : activity?.recent_users?.length > 0 ? (
                            <div className="admin-activity-list">
                                {activity.recent_users.map((user) => (
                                    <div
                                        className="admin-activity-item"
                                        key={user.id}
                                    >
                                        <div className="admin-activity-avatar">
                                            {user.email?.[0]?.toUpperCase() || "U"}
                                        </div>

                                        <div className="admin-activity-details">
                                            <strong>{user.email}</strong>
                                            <span>
                                                Registered {formatDate(user.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ActivityEmpty message="No recent users found." />
                        )}
                    </div>

                    {/* Recent Documents */}
                    <div className="admin-activity-card">
                        <div className="admin-activity-card-heading">
                            <FileText size={19} />
                            <h3>Recent Documents</h3>
                        </div>

                        {loadingActivity ? (
                            <ActivityEmpty message="Loading documents..." />
                        ) : activity?.recent_documents?.length > 0 ? (
                            <div className="admin-activity-list">
                                {activity.recent_documents.map((document) => (
                                    <div
                                        className="admin-activity-item"
                                        key={document.id}
                                    >
                                        <div className="admin-activity-avatar document-avatar">
                                            <FileText size={18} />
                                        </div>

                                        <div className="admin-activity-details">
                                            <strong>
                                                {document.original_name || document.name}
                                            </strong>

                                            <span>
                                                {document.project_name} · {document.uploaded_by_email}
                                            </span>

                                            <span>
                                                {formatBytes(document.size)} · {formatDate(document.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ActivityEmpty message="No recent documents found." />
                        )}
                    </div>

                    {/* Recent API Requests */}
                    <div className="admin-activity-card">
                        <div className="admin-activity-card-heading">
                            <Activity size={19} />
                            <h3>Recent API Requests</h3>
                        </div>

                        {loadingActivity ? (
                            <ActivityEmpty message="Loading requests..." />
                        ) : activity?.recent_requests?.length > 0 ? (
                            <div className="admin-activity-list">
                                {activity.recent_requests.map((request) => (
                                    <div
                                        className="admin-activity-item request-item"
                                        key={request.id}
                                    >
                                        <div className="admin-request-status">
                                            <span
                                                className={
                                                    request.status_code >= 500
                                                        ? "request-status-error"
                                                        : request.status_code >= 400
                                                            ? "request-status-warning"
                                                            : "request-status-success"
                                                }
                                            >
                                                {request.status_code}
                                            </span>
                                        </div>

                                        <div className="admin-activity-details">
                                            <strong>
                                                {request.method} {request.path}
                                            </strong>

                                            <span>{request.project_name}</span>

                                            <span>
                                                {request.latency_ms} ms · {formatDate(request.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ActivityEmpty message="No recent API requests found." />
                        )}
                    </div>

                </div>
            </section>
        </div>
    );
}

export default AdminOverviewPage;
