import { useCallback, useEffect, useState } from "react";
import {
    Key,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Plus,
    Copy,
    Check,
    AlertTriangle,
    Shield,
    UserCheck,
    Ban,
    Building2,
    FolderKanban,
    User,
    Clock,
    Share2,
} from "lucide-react";

import { Alert } from "../components/Alert";
import { EmptyMessage } from "../components/EmptyMessage";
import { Modal } from "../components/Modal/Modal";
import { adminService } from "../services/adminService";

const PAGE_SIZE = 20;

const AVAILABLE_SCOPES = [
    {
        id: "data:read",
        label: "data:read",
        desc: "Read project data and protected resources",
    },
    {
        id: "data:write",
        label: "data:write",
        desc: "Write or update project datasets",
    },
    {
        id: "usage:read",
        label: "usage:read",
        desc: "Read key usage metrics and rate limits",
    },
];

function formatDate(value) {
    if (!value) return "Never";
    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusLabel(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getErrorMessage(err, fallback = "An unexpected error occurred.") {
    if (!err) return fallback;
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
    return err.message || fallback;
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

    // -------------------------------------------------------------
    // Create Key Modal State
    // -------------------------------------------------------------
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: "",
        organizationId: "",
        projectId: "",
        userId: "",
        scopes: ["data:read"],
        expiry: "30",
    });
    const [createOrgProjects, setCreateOrgProjects] = useState([]);
    const [createOrgMembers, setCreateOrgMembers] = useState([]);
    const [loadingCreateOrgData, setLoadingCreateOrgData] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // -------------------------------------------------------------
    // One-Time Created Secret Modal State
    // -------------------------------------------------------------
    const [createdKeyData, setCreatedKeyData] = useState(null);
    const [copied, setCopied] = useState(false);

    // -------------------------------------------------------------
    // Reassign / Share Key Modal State
    // -------------------------------------------------------------
    const [keyToReassign, setKeyToReassign] = useState(null);
    const [reassignUserId, setReassignUserId] = useState("");
    const [reassignMembers, setReassignMembers] = useState([]);
    const [loadingReassignMembers, setLoadingReassignMembers] = useState(false);
    const [reassigning, setReassigning] = useState(false);
    const [reassignError, setReassignError] = useState("");

    // -------------------------------------------------------------
    // Revoke Confirmation Modal State
    // -------------------------------------------------------------
    const [keyToRevoke, setKeyToRevoke] = useState(null);
    const [revoking, setRevoking] = useState(false);
    const [revokeError, setRevokeError] = useState("");

    // -------------------------------------------------------------
    // Load Inventory
    // -------------------------------------------------------------
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

            setApiKeys(result.api_keys ?? []);
            setTotal(result.total ?? 0);
        } catch (err) {
            setError(getErrorMessage(err, "Unable to load API keys."));
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
                setProjects(result.projects ?? []);
            })
            .catch(() => {
                setProjects([]);
            });
    }, [organizationId]);

    useEffect(() => {
        loadApiKeys();
    }, [loadApiKeys]);

    // -------------------------------------------------------------
    // Load Org Projects and Members for Create Key Modal
    // -------------------------------------------------------------
    const loadCreateOrgData = useCallback(async (orgId) => {
        if (!orgId) {
            setCreateOrgProjects([]);
            setCreateOrgMembers([]);
            return;
        }

        setLoadingCreateOrgData(true);
        try {
            const [projResult, membersResult] = await Promise.all([
                adminService.getProjects({
                    organization_id: orgId,
                    page: 1,
                    page_size: 100,
                }),
                adminService.getOrganizationMembers(orgId).catch(() => []),
            ]);

            setCreateOrgProjects(projResult.projects ?? []);
            setCreateOrgMembers(membersResult ?? []);
        } catch (err) {
            console.error("Failed to load organization data:", err);
            setCreateOrgProjects([]);
            setCreateOrgMembers([]);
        } finally {
            setLoadingCreateOrgData(false);
        }
    }, []);

    // -------------------------------------------------------------
    // Create Key Handlers
    // -------------------------------------------------------------
    const handleOpenCreateModal = () => {
        const initialOrgId = organizationId || (organizations[0]?.id ?? "");
        setCreateForm({
            name: "",
            organizationId: initialOrgId,
            projectId: projectId || "",
            userId: "",
            scopes: ["data:read"],
            expiry: "30",
        });
        setCreateError("");
        setShowCreateModal(true);

        if (initialOrgId) {
            loadCreateOrgData(initialOrgId);
        }
    };

    const handleCloseCreateModal = () => {
        if (creating) return;
        setShowCreateModal(false);
        setCreateError("");
    };

    const handleCreateOrgChange = (orgId) => {
        setCreateForm((prev) => ({
            ...prev,
            organizationId: orgId,
            projectId: "",
            userId: "",
        }));
        loadCreateOrgData(orgId);
    };

    const handleToggleScope = (scopeId) => {
        setCreateForm((prev) => {
            const exists = prev.scopes.includes(scopeId);
            return {
                ...prev,
                scopes: exists
                    ? prev.scopes.filter((s) => s !== scopeId)
                    : [...prev.scopes, scopeId],
            };
        });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateError("");

        const cleanName = createForm.name.trim();
        if (cleanName.length < 2 || cleanName.length > 100) {
            setCreateError("API key name must be between 2 and 100 characters.");
            return;
        }

        if (!createForm.organizationId) {
            setCreateError("Please select an organization.");
            return;
        }

        if (!createForm.projectId) {
            setCreateError("Please select a project.");
            return;
        }

        if (!createForm.userId) {
            setCreateError("Please select an assigned user.");
            return;
        }

        if (createForm.scopes.length === 0) {
            setCreateError("Please select at least one permission scope.");
            return;
        }

        const expiresAt =
            createForm.expiry === "never"
                ? null
                : new Date(
                      Date.now() + Number(createForm.expiry) * 86400000
                  ).toISOString();

        setCreating(true);

        try {
            const result = await adminService.createApiKey({
                name: cleanName,
                project_id: createForm.projectId,
                user_id: createForm.userId,
                scopes: createForm.scopes,
                expires_at: expiresAt,
            });

            // Close creation form and immediately present the secret modal
            setShowCreateModal(false);
            setCreatedKeyData(result);
            setNotice(`API key "${cleanName}" created successfully.`);
            await loadApiKeys();
        } catch (err) {
            setCreateError(getErrorMessage(err, "Failed to create API key."));
        } finally {
            setCreating(false);
        }
    };

    // -------------------------------------------------------------
    // Secret Copy Handler
    // -------------------------------------------------------------
    const handleCopySecret = async (secret) => {
        try {
            await navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const el = document.createElement("textarea");
            el.value = secret;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCloseSecretModal = () => {
        // Discard raw secret from memory permanently
        setCreatedKeyData(null);
        setCopied(false);
    };

    // -------------------------------------------------------------
    // Reassign / Share Key Handlers
    // -------------------------------------------------------------
    const handleOpenReassignModal = async (key) => {
        setKeyToReassign(key);
        setReassignUserId("");
        setReassignError("");
        setReassignMembers([]);
        setLoadingReassignMembers(true);

        try {
            const members = await adminService
                .getOrganizationMembers(key.organization_id)
                .catch(() => []);
            setReassignMembers(members);
        } catch (err) {
            console.error("Failed to load members for reassignment:", err);
        } finally {
            setLoadingReassignMembers(false);
        }
    };

    const handleCloseReassignModal = () => {
        if (reassigning) return;
        setKeyToReassign(null);
        setReassignError("");
    };

    const handleReassignSubmit = async (e) => {
        e.preventDefault();
        if (!keyToReassign || !reassignUserId) {
            setReassignError("Please select a user to reassign this API key to.");
            return;
        }

        setReassigning(true);
        setReassignError("");

        try {
            await adminService.reassignApiKey(keyToReassign.id, {
                user_id: reassignUserId,
            });

            const targetUser = reassignMembers.find((m) => m.id === reassignUserId);
            const userLabel = targetUser?.email || "the selected user";

            setNotice(
                `API key "${keyToReassign.name}" successfully reassigned to ${userLabel}.`
            );
            handleCloseReassignModal();
            await loadApiKeys();
        } catch (err) {
            setReassignError(getErrorMessage(err, "Failed to reassign API key."));
        } finally {
            setReassigning(false);
        }
    };

    // -------------------------------------------------------------
    // Revoke Handlers
    // -------------------------------------------------------------
    const handleOpenRevokeModal = (key) => {
        setKeyToRevoke(key);
        setRevokeError("");
    };

    const handleCloseRevokeModal = () => {
        if (revoking) return;
        setKeyToRevoke(null);
        setRevokeError("");
    };

    const handleRevokeSubmit = async () => {
        if (!keyToRevoke) return;

        setRevoking(true);
        setRevokeError("");

        try {
            await adminService.revokeApiKey(keyToRevoke.id);
            const keyName = keyToRevoke.name;
            setKeyToRevoke(null);
            setNotice(`API key "${keyName}" revoked successfully.`);
            await loadApiKeys();
        } catch (err) {
            setRevokeError(getErrorMessage(err, "Unable to revoke API key."));
        } finally {
            setRevoking(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // -------------------------------------------------------------
    // Render
    // -------------------------------------------------------------
    return (
        <div className="admin-api-keys-page">
            {/* Header */}
            <div className="admin-api-keys-header">
                <div>
                    <h1>API Key Management</h1>
                    <p>Provision, assign, and manage developer API credentials across projects.</p>
                </div>

                <div className="admin-api-keys-header-actions">
                    <button
                        className="btn-secondary"
                        onClick={loadApiKeys}
                        disabled={loading}
                        type="button"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        className="admin-btn-primary"
                        onClick={handleOpenCreateModal}
                        type="button"
                        title="Provision a new API key"
                    >
                        <Plus size={16} />
                        Create API Key
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {notice && (
                <Alert
                    type="success"
                    message={notice}
                    onDismiss={() => setNotice("")}
                />
            )}

            {error && (
                <Alert
                    type="error"
                    message={error}
                    onDismiss={() => setError("")}
                />
            )}

            {/* Toolbar */}
            <div className="admin-api-keys-toolbar">
                <div className="admin-api-keys-search-wrapper">
                    <Search size={16} />
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
                </div>

                <select
                    className="admin-api-keys-filter"
                    value={organizationId}
                    onChange={(event) => {
                        setOrganizationId(event.target.value);
                        setProjectId("");
                        setPage(1);
                    }}
                    aria-label="Filter by organization"
                >
                    <option value="">All organizations</option>
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                            {org.name}
                        </option>
                    ))}
                </select>

                <select
                    className="admin-api-keys-filter"
                    value={projectId}
                    disabled={!organizationId}
                    onChange={(event) => {
                        setProjectId(event.target.value);
                        setPage(1);
                    }}
                    aria-label="Filter by project"
                >
                    <option value="">All projects</option>
                    {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                            {proj.name}
                        </option>
                    ))}
                </select>

                <select
                    className="admin-api-keys-filter"
                    value={status}
                    onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                    }}
                    aria-label="Filter by status"
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="revoked">Revoked</option>
                    <option value="expired">Expired</option>
                </select>

                <div className="admin-api-keys-count">
                    <Key size={16} />
                    <span>{total} API key{total !== 1 ? "s" : ""}</span>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="admin-api-keys-table-card">
                <div className="admin-api-keys-table-wrapper">
                    <table className="admin-api-keys-table">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Organization</th>
                                <th>Project</th>
                                <th>Assigned User</th>
                                <th>Scopes</th>
                                <th>Status</th>
                                <th>Expires</th>
                                <th>Last Used</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="10">
                                        <div className="admin-api-keys-loading">
                                            Loading API keys...
                                        </div>
                                    </td>
                                </tr>
                            ) : apiKeys.length === 0 ? (
                                <tr>
                                    <td colSpan="10">
                                        <EmptyMessage
                                            icon={Key}
                                            title="No API keys found"
                                            description={
                                                search || organizationId || projectId || status
                                                    ? "Try changing your search or filters."
                                                    : "There are no API keys provisioned yet."
                                            }
                                        />
                                    </td>
                                </tr>
                            ) : (
                                apiKeys.map((key) => (
                                    <tr key={key.id}>
                                        <td>
                                            <div className="admin-api-key-name-cell">
                                                <strong>{key.name}</strong>
                                                <code className="admin-api-key-prefix">
                                                    {key.key_prefix}
                                                    {"..."}
                                                    {key.key_suffix || ""}
                                                </code>
                                            </div>
                                        </td>

                                        <td>{key.organization_name}</td>
                                        <td>{key.project_name}</td>

                                        <td>
                                            <span className="admin-api-key-user">
                                                {key.assigned_user_email || key.created_by_email || "Unassigned"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-api-key-scopes">
                                                {key.scopes.map((scope) => (
                                                    <span key={scope} className="admin-scope-badge">
                                                        {scope}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>

                                        <td>
                                            <span className={`admin-api-key-status ${key.status}`}>
                                                {getStatusLabel(key.status)}
                                            </span>
                                        </td>

                                        <td>{formatDate(key.expires_at)}</td>
                                        <td>{formatDate(key.last_used_at)}</td>
                                        <td>{formatDate(key.created_at)}</td>

                                        <td>
                                            <div className="admin-api-key-actions-cell">
                                                {/* Reassign / Share */}
                                                {key.status !== "revoked" ? (
                                                    <button
                                                        type="button"
                                                        className="admin-key-action-btn admin-key-reassign-btn"
                                                        onClick={() => handleOpenReassignModal(key)}
                                                        title="Reassign or transfer key access to another user"
                                                    >
                                                        <Share2 size={13} />
                                                        <span>Reassign</span>
                                                    </button>
                                                ) : null}

                                                {/* Revoke */}
                                                {key.status === "active" ? (
                                                    <button
                                                        type="button"
                                                        className="admin-key-action-btn admin-key-revoke-btn"
                                                        onClick={() => handleOpenRevokeModal(key)}
                                                        title="Revoke API key immediately"
                                                    >
                                                        <Ban size={13} />
                                                        <span>Revoke</span>
                                                    </button>
                                                ) : (
                                                    <span className="admin-api-key-disabled">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="admin-api-keys-pagination">
                    <span>
                        {total === 0
                            ? "Showing 0 keys"
                            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                                  page * PAGE_SIZE,
                                  total
                              )} of ${total}`}
                    </span>

                    <div className="admin-api-keys-pagination-actions">
                        <button
                            className="btn-secondary"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => current - 1)}
                            type="button"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="admin-api-keys-page-number">
                            {page} / {totalPages}
                        </span>

                        <button
                            className="btn-secondary"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((current) => current + 1)}
                            type="button"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================= */}
            {/* Create API Key Modal                                          */}
            {/* ============================================================= */}
            {showCreateModal && (
                <Modal title="Create API Key" onClose={handleCloseCreateModal}>
                    <form
                        onSubmit={handleCreateSubmit}
                        className="admin-modal-form"
                        noValidate
                    >
                        {createError && (
                            <Alert
                                type="error"
                                message={createError}
                                onDismiss={() => setCreateError("")}
                            />
                        )}

                        {/* Organization Selection */}
                        <div className="admin-form-group">
                            <label htmlFor="create-key-org">
                                Target Organization <span className="required">*</span>
                            </label>
                            <select
                                id="create-key-org"
                                value={createForm.organizationId}
                                onChange={(e) => handleCreateOrgChange(e.target.value)}
                                disabled={creating}
                            >
                                <option value="">Select Organization</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Project Selection */}
                        <div className="admin-form-group">
                            <label htmlFor="create-key-project">
                                Target Project <span className="required">*</span>
                            </label>
                            <select
                                id="create-key-project"
                                value={createForm.projectId}
                                onChange={(e) =>
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        projectId: e.target.value,
                                    }))
                                }
                                disabled={
                                    creating ||
                                    !createForm.organizationId ||
                                    loadingCreateOrgData
                                }
                            >
                                <option value="">
                                    {loadingCreateOrgData
                                        ? "Loading projects..."
                                        : !createForm.organizationId
                                        ? "Select an organization first"
                                        : createOrgProjects.length === 0
                                        ? "No projects found in this organization"
                                        : "Select Project"}
                                </option>
                                {createOrgProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assigned User Selection */}
                        <div className="admin-form-group">
                            <label htmlFor="create-key-user">
                                Assigned User (Owner) <span className="required">*</span>
                            </label>
                            <select
                                id="create-key-user"
                                value={createForm.userId}
                                onChange={(e) =>
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        userId: e.target.value,
                                    }))
                                }
                                disabled={
                                    creating ||
                                    !createForm.organizationId ||
                                    loadingCreateOrgData
                                }
                            >
                                <option value="">
                                    {loadingCreateOrgData
                                        ? "Loading members..."
                                        : !createForm.organizationId
                                        ? "Select an organization first"
                                        : createOrgMembers.length === 0
                                        ? "No members found in this organization"
                                        : "Select Assigned User"}
                                </option>
                                {createOrgMembers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.email} ({m.role})
                                    </option>
                                ))}
                            </select>
                            <span className="field-hint">
                                The user accountable for this key. Only members of this organization can be assigned.
                            </span>
                        </div>

                        {/* Key Name Input */}
                        <div className="admin-form-group">
                            <label htmlFor="create-key-name">
                                API Key Name / Purpose <span className="required">*</span>
                            </label>
                            <input
                                id="create-key-name"
                                type="text"
                                placeholder="e.g. CI/CD Pipeline Worker, Integration Bot"
                                value={createForm.name}
                                onChange={(e) =>
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                minLength={2}
                                maxLength={100}
                                disabled={creating}
                            />
                        </div>

                        {/* Scopes Selection */}
                        <div className="admin-form-group">
                            <label>
                                Permissions & Scopes <span className="required">*</span>
                            </label>
                            <div className="admin-scopes-picker">
                                {AVAILABLE_SCOPES.map((scope) => (
                                    <label
                                        key={scope.id}
                                        className={`admin-scope-item ${
                                            createForm.scopes.includes(scope.id)
                                                ? "selected"
                                                : ""
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={createForm.scopes.includes(scope.id)}
                                            onChange={() => handleToggleScope(scope.id)}
                                            disabled={creating}
                                        />
                                        <div className="admin-scope-text">
                                            <strong>{scope.label}</strong>
                                            <small>{scope.desc}</small>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Expiry Selection */}
                        <div className="admin-form-group">
                            <label htmlFor="create-key-expiry">
                                Expiration Duration
                            </label>
                            <select
                                id="create-key-expiry"
                                value={createForm.expiry}
                                onChange={(e) =>
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        expiry: e.target.value,
                                    }))
                                }
                                disabled={creating}
                            >
                                <option value="7">7 Days</option>
                                <option value="30">30 Days (Recommended)</option>
                                <option value="90">90 Days</option>
                                <option value="never">No Expiration (Never)</option>
                            </select>
                        </div>

                        {/* Modal Actions */}
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseCreateModal}
                                disabled={creating}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="admin-btn-primary"
                                disabled={
                                    creating ||
                                    !createForm.name.trim() ||
                                    !createForm.organizationId ||
                                    !createForm.projectId ||
                                    !createForm.userId ||
                                    createForm.scopes.length === 0
                                }
                            >
                                <Key size={15} />
                                {creating ? "Generating Key..." : "Generate API Key"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ============================================================= */}
            {/* One-Time Secret Key Display Modal                             */}
            {/* ============================================================= */}
            {createdKeyData && (
                <Modal
                    title="API Key Generated Successfully"
                    onClose={handleCloseSecretModal}
                >
                    <div className="admin-modal-body admin-created-key-body">
                        <div className="admin-key-secret-warning">
                            <AlertTriangle size={20} className="warning-icon" />
                            <div>
                                <strong>Important: Copy Your Secret Key Now</strong>
                                <p>
                                    This raw secret key is displayed <strong>ONLY ONCE</strong>.
                                    For security, Antigravity never stores raw secrets and this key
                                    cannot be recovered after closing this window.
                                </p>
                            </div>
                        </div>

                        <div className="admin-key-secret-container">
                            <code className="admin-key-raw-secret">
                                {createdKeyData.api_key}
                            </code>

                            <button
                                type="button"
                                className={`admin-key-copy-btn ${copied ? "copied" : ""}`}
                                onClick={() => handleCopySecret(createdKeyData.api_key)}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                <span>{copied ? "Copied!" : "Copy Key"}</span>
                            </button>
                        </div>

                        <div className="admin-created-key-details">
                            <div className="detail-row">
                                <span className="label"><Key size={13} /> Key Name:</span>
                                <span className="value"><strong>{createdKeyData.name}</strong></span>
                            </div>
                            <div className="detail-row">
                                <span className="label"><User size={13} /> Assigned User:</span>
                                <span className="value">{createdKeyData.assigned_user_email}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label"><FolderKanban size={13} /> Project:</span>
                                <span className="value">{createdKeyData.project_name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label"><Building2 size={13} /> Organization:</span>
                                <span className="value">{createdKeyData.organization_name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label"><Shield size={13} /> Scopes:</span>
                                <span className="value">{createdKeyData.scopes.join(", ")}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label"><Clock size={13} /> Expires:</span>
                                <span className="value">{formatDate(createdKeyData.expires_at)}</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="admin-btn-primary full-width"
                                onClick={handleCloseSecretModal}
                            >
                                <Check size={16} />
                                I have copied my secret key (Done)
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ============================================================= */}
            {/* Reassign / Share Key Modal                                    */}
            {/* ============================================================= */}
            {keyToReassign && (
                <Modal
                    title="Reassign API Key Access"
                    onClose={handleCloseReassignModal}
                >
                    <form
                        onSubmit={handleReassignSubmit}
                        className="admin-modal-form"
                        noValidate
                    >
                        {reassignError && (
                            <Alert
                                type="error"
                                message={reassignError}
                                onDismiss={() => setReassignError("")}
                            />
                        )}

                        <div className="admin-reassign-info">
                            <Share2 size={18} className="info-icon" />
                            <div>
                                <strong>Secure Access Transfer</strong>
                                <p>
                                    Reassign this key to transfer authorization and accountability to
                                    another member of organization <strong>{keyToReassign.organization_name}</strong>.
                                    The secret credential itself remains secure and is never exposed.
                                </p>
                            </div>
                        </div>

                        <div className="admin-delete-target-badge">
                            <strong>{keyToReassign.name}</strong>
                            <span>
                                {keyToReassign.key_prefix}...{keyToReassign.key_suffix || ""} • {keyToReassign.project_name} ({keyToReassign.organization_name})
                            </span>
                            <span style={{ color: "#0d9488", fontWeight: 600 }}>
                                Currently Assigned: {keyToReassign.assigned_user_email || keyToReassign.created_by_email || "Unassigned"}
                            </span>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="reassign-user-select">
                                New Assigned User <span className="required">*</span>
                            </label>
                            <select
                                id="reassign-user-select"
                                value={reassignUserId}
                                onChange={(e) => setReassignUserId(e.target.value)}
                                disabled={reassigning || loadingReassignMembers}
                            >
                                <option value="">
                                    {loadingReassignMembers
                                        ? "Loading members..."
                                        : reassignMembers.length === 0
                                        ? "No eligible members found"
                                        : "Select New Assigned User"}
                                </option>
                                {reassignMembers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.email} ({m.role})
                                    </option>
                                ))}
                            </select>
                            <span className="field-hint">
                                Select an active member of {keyToReassign.organization_name} to take ownership of this key.
                            </span>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseReassignModal}
                                disabled={reassigning}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="admin-btn-primary"
                                disabled={reassigning || !reassignUserId}
                            >
                                <UserCheck size={15} />
                                {reassigning ? "Transferring..." : "Confirm Reassignment"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ============================================================= */}
            {/* Revoke Confirmation Modal                                     */}
            {/* ============================================================= */}
            {keyToRevoke && (
                <Modal
                    title="Revoke API Key"
                    onClose={handleCloseRevokeModal}
                >
                    <div className="admin-delete-modal">
                        {revokeError && (
                            <Alert
                                type="error"
                                message={revokeError}
                                onDismiss={() => setRevokeError("")}
                            />
                        )}

                        <div className="admin-delete-warning">
                            <AlertTriangle size={20} className="admin-delete-warning-icon" />
                            <div>
                                <strong>Immediate Authentication Invalidation</strong>
                                <p>
                                    Revoking this API key is irreversible. Applications and automated
                                    clients using this credential will immediately receive 401 Unauthorized errors.
                                </p>
                            </div>
                        </div>

                        <div className="admin-delete-target-badge">
                            <strong>{keyToRevoke.name}</strong>
                            <span>
                                Identifier: {keyToRevoke.key_prefix}...{keyToRevoke.key_suffix || ""}
                            </span>
                            <span>
                                Project: {keyToRevoke.project_name} ({keyToRevoke.organization_name})
                            </span>
                            <span>
                                Assigned User: {keyToRevoke.assigned_user_email || keyToRevoke.created_by_email || "Unassigned"}
                            </span>
                        </div>

                        <p className="admin-delete-prompt">
                            Are you sure you want to revoke API key <strong>"{keyToRevoke.name}"</strong>?
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseRevokeModal}
                                disabled={revoking}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleRevokeSubmit}
                                disabled={revoking}
                            >
                                <Ban size={15} />
                                {revoking ? "Revoking..." : "Confirm Revocation"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
