
import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    FileText,
    Clock,
    RefreshCw,
} from "lucide-react";

import { useWorkspace } from "../../../hooks/useWorkspace";
import { fileService } from "../../../services/fileService";
import { apiKeyService } from "../../../services/apiKeyService";
import { EmptyMessage } from "../../../components/EmptyMessage";

const MAX_KEY_LOOKUPS = 5;
const MAX_ACTIVITIES = 8;

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function getFileName(file) {
    return file.original_name || file.originalName || file.name || "Unnamed file";
}

function getFileDate(file) {
    return file.created_at || file.createdAt || file.uploaded_at || null;
}

function getFileList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.files)) return response.files;
    if (Array.isArray(response?.items)) return response.items;

    return [];
}

function getStatusClass(statusCode) {
    if (statusCode >= 500) return "activity-status-error";
    if (statusCode >= 400) return "activity-status-warning";

    return "activity-status-success";
}

export function RecentActivity() {
    const { projectId, keys } = useWorkspace();

    const [files, setFiles] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Keep the effect dependency stable when the key objects are refreshed.
    const activeKeyIds = useMemo(
        () =>
            (keys || [])
                .filter((key) => key.status === "active")
                .slice(0, MAX_KEY_LOOKUPS)
                .map((key) => key.id),
        [keys]
    );

    const keyLookup = useMemo(
        () =>
            (keys || []).reduce((result, key) => {
                result[key.id] = key.name;
                return result;
            }, {}),
        [keys]
    );

    useEffect(() => {
        let isMounted = true;

        async function loadActivity() {
            if (!projectId) {
                setFiles([]);
                setRequests([]);
                setError("");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            const fileTask = fileService.list(projectId);

            const requestTask = Promise.all(
                activeKeyIds.map(async (keyId) => {
                    try {
                        const details =
                            await apiKeyService.getUserApiKeyDetails(keyId);

                        return (details?.recent_activity || []).map((log) => ({
                            ...log,
                            key_name: details.name || keyLookup[keyId] || "Assigned API key",
                        }));
                    } catch {
                        // A single key's telemetry should not break the whole panel.
                        return [];
                    }
                })
            );

            try {
                const [fileResponse, requestGroups] = await Promise.all([
                    fileTask,
                    requestTask,
                ]);

                if (!isMounted) return;

                const fileItems = getFileList(fileResponse)
                    .filter((file) => file.status !== "DELETED")
                    .sort(
                        (a, b) =>
                            new Date(getFileDate(b) || 0) -
                            new Date(getFileDate(a) || 0)
                    )
                    .slice(0, MAX_ACTIVITIES);

                const requestItems = requestGroups
                    .flat()
                    .map((log) => ({
                        ...log,
                        activityDate: log.created_at || log.createdAt,
                    }))
                    .sort(
                        (a, b) =>
                            new Date(b.activityDate || 0) -
                            new Date(a.activityDate || 0)
                    )
                    .slice(0, MAX_ACTIVITIES);

                setFiles(fileItems);
                setRequests(requestItems);
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.detail ||
                        "Unable to load recent activity."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadActivity();

        return () => {
            isMounted = false;
        };
    }, [projectId, activeKeyIds, keyLookup]);

    const hasActivity = files.length > 0 || requests.length > 0;

    return (
        <section className="panel user-recent-activity">
            <div className="panel-heading">
                <div>
                    <h2>Recent Activity</h2>
                    <p>
                        Recent files and API requests for the selected project
                    </p>
                </div>
            </div>

            {error && (
                <div className="activity-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="activity-loading">
                    <RefreshCw size={18} className="spin" />
                    <span>Loading recent activity...</span>
                </div>
            ) : !projectId ? (
                <EmptyMessage message="Select a project to view its recent activity." />
            ) : !hasActivity ? (
                <EmptyMessage message="No recent files or API requests found for this project." />
            ) : (
                <div className="user-activity-grid">
                    {/* Recent files */}
                    <div className="user-activity-card">
                        <div className="user-activity-card-heading">
                            <FileText size={18} />
                            <h3>Recent Files</h3>
                        </div>

                        {files.length > 0 ? (
                            <div className="user-activity-list">
                                {files.map((file) => (
                                    <div
                                        className="user-activity-item"
                                        key={file.id}
                                    >
                                        <div className="user-activity-icon file-activity-icon">
                                            <FileText size={16} />
                                        </div>

                                        <div className="user-activity-details">
                                            <strong title={getFileName(file)}>
                                                {getFileName(file)}
                                            </strong>

                                            <span>
                                                {formatDate(getFileDate(file))}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="user-activity-empty">
                                No recent files.
                            </div>
                        )}
                    </div>

                    {/* Recent API requests */}
                    <div className="user-activity-card">
                        <div className="user-activity-card-heading">
                            <Activity size={18} />
                            <h3>Recent API Requests</h3>
                        </div>

                        {requests.length > 0 ? (
                            <div className="user-activity-list">
                                {requests.map((request) => (
                                    <div
                                        className="user-activity-item"
                                        key={request.id}
                                    >
                                        <div className="user-activity-icon">
                                            <span
                                                className={getStatusClass(
                                                    request.status_code
                                                )}
                                            >
                                                {request.status_code}
                                            </span>
                                        </div>

                                        <div className="user-activity-details">
                                            <strong>
                                                {request.method} {request.path}
                                            </strong>

                                            <span>
                                                {request.key_name}
                                            </span>

                                            <span className="activity-meta">
                                                <Clock size={12} />
                                                {request.latency_ms} ms ·{" "}
                                                {formatDate(
                                                    request.activityDate
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="user-activity-empty">
                                No recent API requests.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export default RecentActivity;
