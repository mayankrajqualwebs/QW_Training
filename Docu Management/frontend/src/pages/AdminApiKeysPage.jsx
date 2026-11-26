import { useCallback, useEffect, useState } from "react";
import { adminService } from "../services/adminService";

const PAGE_SIZE = 20;

function formatDate(value) {
    if (!value) return "Never";

    return new Date(value).toLocaleString();
}

function getStatusLabel(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminApiKeysPage() {
    const [apiKeys, setApiKeys] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [projects, setProjects] = useState([]);

    const [search, setSearch] = useState("");
    const [organizationId, setOrganizationId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [status, setStatus] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadApiKeys = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await adminService.getApiKeys({
                search: search || undefined,
                organization_id: organizationId || undefined,
                project_id: projectId || undefined,
                status: status || undefined,
                page,
                page_size: PAGE_SIZE,
            });

            setApiKeys(result.api_keys);
            setTotal(result.total);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load API keys."
            );
        } finally {
            setLoading(false);
        }
    }, [search, organizationId, projectId, status, page]);

    useEffect(() => {
        adminService
            .getOrganizations()
            .then(setOrganizations)
            .catch(() => {
                setError("Unable to load organizations.");
            });
    }, []);

    useEffect(() => {
        if (!organizationId) {
            setProjects([]);
            setProjectId("");
            return;
        }

        adminService
            .getProjects({
                organization_id: organizationId,
                page: 1,
                page_size: 100,
            })
            .then((result) => {
                setProjects(result.projects);
            })
            .catch(() => {
                setProjects([]);
            });
    }, [organizationId]);

    useEffect(() => {
        loadApiKeys();
    }, [loadApiKeys]);

    const handleRevoke = async (key) => {
        const confirmed = window.confirm(
            `Revoke API key "${key.name}"?\n\n` +
            "Applications using this key will no longer be able to authenticate."
        );

        if (!confirmed) return;

        try {
            await adminService.revokeApiKey(key.id);

            setNotice(`API key "${key.name}" revoked successfully.`);

            // Refresh current inventory.
            await loadApiKeys();
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to revoke API key."
            );
        }
    };

    const totalPages = Math.max(
        1,
        Math.ceil(total / PAGE_SIZE)
    );

    return (
        <div className="admin-api-keys-page">
            <div className="admin-api-keys-toolbar">
                <input
                    className="admin-api-keys-search"
                    type="search"
                    placeholder="Search key name or prefix..."
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                />

                <select
                    value={organizationId}
                    onChange={(event) => {
                        setOrganizationId(event.target.value);
                        setProjectId("");
                        setPage(1);
                    }}
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
                    disabled={!organizationId}
                    onChange={(event) => {
                        setProjectId(event.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All projects</option>

                    {projects.map((project) => (
                        <option
                            key={project.id}
                            value={project.id}
                        >
                            {project.name}
                        </option>
                    ))}
                </select>

                <select
                    value={status}
                    onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="revoked">Revoked</option>
                    <option value="expired">Expired</option>
                </select>

                <button
                    type="button"
                    onClick={loadApiKeys}
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {notice && (
                <div className="admin-api-keys-notice">
                    {notice}
                </div>
            )}

            {error && (
                <div className="admin-api-keys-error">
                    {error}
                </div>
            )}

            <div className="admin-api-keys-table-wrapper">
                <table className="admin-api-keys-table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Organization</th>
                            <th>Project</th>
                            <th>Created By</th>
                            <th>Scopes</th>
                            <th>Status</th>
                            <th>Expires</th>
                            <th>Last Used</th>
                            <th>Created</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="10">
                                    Loading API keys...
                                </td>
                            </tr>
                        ) : apiKeys.length === 0 ? (
                            <tr>
                                <td colSpan="10">
                                    No API keys found.
                                </td>
                            </tr>
                        ) : (
                            apiKeys.map((key) => (
                                <tr key={key.id}>
                                    <td>
                                        <strong>{key.name}</strong>
                                        <small className="admin-api-key-prefix">
                                            {key.key_prefix}
                                            {"..."}
                                            {key.key_suffix || ""}
                                        </small>
                                    </td>

                                    <td>{key.organization_name}</td>
                                    <td>{key.project_name}</td>
                                    <td>{key.created_by_email}</td>

                                    <td>
                                        <div className="admin-api-key-scopes">
                                            {key.scopes.map((scope) => (
                                                <span key={scope}>
                                                    {scope}
                                                </span>
                                            ))}
                                        </div>
                                    </td>

                                    <td>
                                        <span
                                            className={`admin-api-key-status ${key.status}`}
                                        >
                                            {getStatusLabel(key.status)}
                                        </span>
                                    </td>

                                    <td>{formatDate(key.expires_at)}</td>
                                    <td>{formatDate(key.last_used_at)}</td>
                                    <td>{formatDate(key.created_at)}</td>

                                    <td>
                                        {key.status === "active" ? (
                                            <button
                                                type="button"
                                                className="admin-api-key-revoke"
                                                onClick={() => handleRevoke(key)}
                                            >
                                                Revoke
                                            </button>
                                        ) : (
                                            <span className="admin-api-key-disabled">
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="admin-api-keys-pagination">
                <span>
                    {total} API key{total !== 1 ? "s" : ""}
                </span>

                <div>
                    <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((current) => current - 1)}
                    >
                        Previous
                    </button>

                    <span>
                        Page {page} of {totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}