import { useCallback, useEffect, useMemo, useState } from "react";
import {
    KeyRound,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    AlertTriangle,
    Copy,
    Check,
    Eye,
    EyeOff,
    Activity,
    Clock,
    Calendar,
    FolderKanban,
    Building2,
    Ban,
    FileCode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../components/Alert/Alert";
import { EmptyMessage } from "../components/EmptyMessage";
import { Modal } from "../components/Modal/Modal";
import { KeyList } from "../features/apiKeys/components/KeyList";
import { useWorkspace } from "../hooks/useWorkspace";
import { apiKeyService } from "../services/apiKeyService";
import { dateLabel } from "../utils/date";

export function ApiKeysPage() {
    const {
        setTestingKey,
        triggerScrollToTester,
    } = useWorkspace();

    const navigate = useNavigate();

    // -------------------------------------------------------------
    // Inventory State
    // -------------------------------------------------------------
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    // Filtering & Search
    const [keyFilter, setKeyFilter] = useState("all");
    const [keySearch, setKeySearch] = useState("");

    // -------------------------------------------------------------
    // Reveal Secret Modal State
    // -------------------------------------------------------------
    const [keyToReveal, setKeyToReveal] = useState(null);
    const [revealing, setRevealing] = useState(false);
    const [revealedSecret, setRevealedSecret] = useState(null);
    const [revealError, setRevealError] = useState("");
    const [showSecretText, setShowSecretText] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    // -------------------------------------------------------------
    // Details & Telemetry Modal State
    // -------------------------------------------------------------
    const [keyForDetails, setKeyForDetails] = useState(null);
    const [detailedData, setDetailedData] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    // -------------------------------------------------------------
    // Revoke Confirmation Modal State
    // -------------------------------------------------------------
    const [keyToRevoke, setKeyToRevoke] = useState(null);
    const [revoking, setRevoking] = useState(false);
    const [revokeError, setRevokeError] = useState("");

    // -------------------------------------------------------------
    // Load User API Keys
    // -------------------------------------------------------------
    const loadUserKeys = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiKeyService.getUserApiKeys();
            setKeys(data || []);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || "Failed to load assigned API keys.";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserKeys();
    }, [loadUserKeys]);

    // -------------------------------------------------------------
    // Filtered Keys
    // -------------------------------------------------------------
    const activeKeys = useMemo(
        () => keys.filter((k) => k.status === "active"),
        [keys]
    );

    const pendingRevealKeys = useMemo(
        () => keys.filter((k) => k.can_reveal && k.status === "active"),
        [keys]
    );

    const expiredKeys = useMemo(
        () => keys.filter((k) => k.status === "expired"),
        [keys]
    );

    const revokedKeys = useMemo(
        () => keys.filter((k) => k.status === "revoked"),
        [keys]
    );

    const filteredKeys = useMemo(() => {
        return keys.filter((key) => {
            if (keyFilter === "active" && key.status !== "active") return false;
            if (keyFilter === "reveal" && (!key.can_reveal || key.status !== "active")) return false;
            if (keyFilter === "expired" && key.status !== "expired") return false;
            if (keyFilter === "revoked" && key.status !== "revoked") return false;

            if (keySearch.trim()) {
                const q = keySearch.toLowerCase();
                const matchName = key.name.toLowerCase().includes(q);
                const matchPrefix = key.key_prefix.toLowerCase().includes(q);
                const matchSuffix = Boolean(key.key_suffix && key.key_suffix.toLowerCase().includes(q));
                const matchOrg = Boolean(key.organization_name && key.organization_name.toLowerCase().includes(q));
                const matchProj = Boolean(key.project_name && key.project_name.toLowerCase().includes(q));
                return matchName || matchPrefix || matchSuffix || matchOrg || matchProj;
            }

            return true;
        });
    }, [keys, keyFilter, keySearch]);

    // -------------------------------------------------------------
    // Reveal Handlers
    // -------------------------------------------------------------
    const handleOpenRevealModal = (key) => {
        setKeyToReveal(key);
        setRevealedSecret(null);
        setRevealError("");
        setShowSecretText(false);
        setCopiedSecret(false);
    };

    const handleCloseRevealModal = () => {
        setKeyToReveal(null);
        setRevealedSecret(null);
        setRevealError("");
        setShowSecretText(false);
        setCopiedSecret(false);
        // Refresh keys to update can_reveal state
        loadUserKeys();
    };

    const handleConfirmReveal = async () => {
        if (!keyToReveal) return;

        setRevealing(true);
        setRevealError("");

        try {
            const result = await apiKeyService.revealApiKey(keyToReveal.id);
            setRevealedSecret(result.api_key);
            setNotice(`Secret for "${keyToReveal.name}" revealed. Make sure to copy it now.`);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || "Failed to reveal secret.";
            setRevealError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setRevealing(false);
        }
    };

    const handleCopyRevealedSecret = () => {
        if (!revealedSecret) return;
        void navigator.clipboard.writeText(revealedSecret);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2500);
    };

    // -------------------------------------------------------------
    // Details & Telemetry Handlers
    // -------------------------------------------------------------
    const handleOpenDetailsModal = async (key) => {
        setKeyForDetails(key);
        setDetailedData(null);
        setLoadingDetails(true);
        setDetailsError("");

        try {
            const details = await apiKeyService.getUserApiKeyDetails(key.id);
            setDetailedData(details);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || "Failed to load key details.";
            setDetailsError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseDetailsModal = () => {
        setKeyForDetails(null);
        setDetailedData(null);
        setDetailsError("");
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

    const handleConfirmRevoke = async () => {
        if (!keyToRevoke) return;

        setRevoking(true);
        setRevokeError("");

        try {
            await apiKeyService.revokeUserApiKey(keyToRevoke.id);
            setNotice(`API key "${keyToRevoke.name}" revoked successfully.`);
            handleCloseRevokeModal();
            loadUserKeys();
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || "Failed to revoke API key.";
            setRevokeError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setRevoking(false);
        }
    };

    // -------------------------------------------------------------
    // Render
    // -------------------------------------------------------------
    return (
        <section className="panel user-api-keys-panel">
            {/* Panel Heading */}
            <div className="panel-heading">
                <div>
                    <h2>API Keys & Access</h2>
                    <p>
                        Developer credentials assigned to your account.
                        API keys are provisioned and assigned by workspace administrators.
                    </p>
                </div>

                <div className="user-api-header-actions">
                    <span className="user-admin-managed-badge" title="Key generation and assignment is controlled by administrators">
                        <Shield size={13} /> Admin Managed
                    </span>

                    <button
                        className="secondary-button compact"
                        onClick={loadUserKeys}
                        disabled={loading}
                        type="button"
                        title="Reload API keys"
                    >
                        <RefreshCw size={14} className={loading ? "spin" : ""} />
                        Refresh
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

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-tabs">
                    <button
                        type="button"
                        className={`filter-tab ${keyFilter === "all" ? "active" : ""}`}
                        onClick={() => setKeyFilter("all")}
                    >
                        All ({keys.length})
                    </button>

                    <button
                        type="button"
                        className={`filter-tab ${keyFilter === "active" ? "active" : ""}`}
                        onClick={() => setKeyFilter("active")}
                    >
                        Active ({activeKeys.length})
                    </button>

                    {pendingRevealKeys.length > 0 && (
                        <button
                            type="button"
                            className={`filter-tab highlight-tab ${keyFilter === "reveal" ? "active" : ""}`}
                            onClick={() => setKeyFilter("reveal")}
                            title="Keys with secrets ready to reveal"
                        >
                            <ShieldAlert size={12} style={{ marginRight: 4 }} />
                            Ready to Reveal ({pendingRevealKeys.length})
                        </button>
                    )}

                    <button
                        type="button"
                        className={`filter-tab ${keyFilter === "expired" ? "active" : ""}`}
                        onClick={() => setKeyFilter("expired")}
                    >
                        Expired ({expiredKeys.length})
                    </button>

                    <button
                        type="button"
                        className={`filter-tab ${keyFilter === "revoked" ? "active" : ""}`}
                        onClick={() => setKeyFilter("revoked")}
                    >
                        Revoked ({revokedKeys.length})
                    </button>
                </div>

                <div className="user-api-search-box">
                    <Search size={14} className="search-icon" />
                    <input
                        className="search-input"
                        type="search"
                        placeholder="Search key name, prefix, or project…"
                        value={keySearch}
                        onChange={(e) => setKeySearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Inventory List */}
            {loading && keys.length === 0 ? (
                <div className="user-keys-loading">
                    <RefreshCw size={20} className="spin" />
                    <p>Loading assigned API keys…</p>
                </div>
            ) : (
                <KeyList
                    keys={filteredKeys}
                    detailed={true}
                    onReveal={handleOpenRevealModal}
                    onViewDetails={handleOpenDetailsModal}
                    onRevoke={handleOpenRevokeModal}
                    onSelectForTest={(key) => {
                        setTestingKey("");
                        navigate("/workspace/overview");
                        triggerScrollToTester?.();
                        setNotice(
                            `Selected "${key.name}" for API testing. Paste your credential secret to execute test requests.`
                        );
                    }}
                />
            )}

            {/* ============================================================= */}
            {/* Reveal API Key Modal (One-Time Secure Delivery)                */}
            {/* ============================================================= */}
            {keyToReveal && (
                <Modal
                    title="Secure API Key Delivery"
                    onClose={handleCloseRevealModal}
                >
                    <div className="reveal-modal-body">
                        {revealError && (
                            <Alert
                                type="error"
                                message={revealError}
                                onDismiss={() => setRevealError("")}
                            />
                        )}

                        <div className="reveal-warning-callout">
                            <AlertTriangle size={20} className="warning-icon" />
                            <div>
                                <strong>One-Time Secret Retrieval</strong>
                                <p>
                                    This raw API key secret is delivered <strong>only once</strong> for security.
                                    Plaintext secrets are never permanently preserved in the database.
                                    Copy and store your secret in a password manager or environment variable now.
                                </p>
                            </div>
                        </div>

                        {/* Key Info Banner */}
                        <div className="reveal-key-summary">
                            <div>
                                <span className="label">Key Name:</span>
                                <strong>{keyToReveal.name}</strong>
                            </div>
                            <div>
                                <span className="label">Project:</span>
                                <span>{keyToReveal.project_name} ({keyToReveal.organization_name})</span>
                            </div>
                            <div>
                                <span className="label">Granted Scopes:</span>
                                <code>{(keyToReveal.scopes || []).join(", ")}</code>
                            </div>
                            <div>
                                <span className="label">Expires:</span>
                                <span>{keyToReveal.expiry_date ? dateLabel(keyToReveal.expiry_date) : "Never"}</span>
                            </div>
                        </div>

                        {!revealedSecret ? (
                            <div className="reveal-action-panel">
                                <p>
                                    Click the button below to decrypt and retrieve your secret key.
                                    Once retrieved, this secret cannot be viewed again.
                                </p>
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={handleConfirmReveal}
                                    disabled={revealing}
                                >
                                    <Eye size={15} style={{ marginRight: 6 }} />
                                    {revealing ? "Decrypting Secret…" : "I Am Ready — Reveal Secret Key"}
                                </button>
                            </div>
                        ) : (
                            <div className="revealed-secret-section">
                                <label className="secret-field-label">
                                    Your Raw Secret Key:
                                </label>

                                <div className="revealed-secret-box">
                                    <code>
                                        {showSecretText
                                            ? revealedSecret
                                            : "•".repeat(Math.min(36, revealedSecret.length))}
                                    </code>

                                    <div className="secret-box-buttons">
                                        <button
                                            type="button"
                                            className="icon-button"
                                            title={showSecretText ? "Mask secret" : "Show plaintext secret"}
                                            onClick={() => setShowSecretText((prev) => !prev)}
                                        >
                                            {showSecretText ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>

                                        <button
                                            type="button"
                                            className={`primary-button compact ${copiedSecret ? "copied-btn" : ""}`}
                                            onClick={handleCopyRevealedSecret}
                                        >
                                            {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                                            {copiedSecret ? "Copied!" : "Copy Secret"}
                                        </button>
                                    </div>
                                </div>

                                <p className="secret-security-note">
                                    <Shield size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                                    Never commit secrets to git repositories or expose them in client-side applications.
                                </p>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="primary-button full-width"
                                        onClick={handleCloseRevealModal}
                                    >
                                        <Check size={15} style={{ marginRight: 6 }} />
                                        I Have Safely Saved My Secret Key (Done)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* ============================================================= */}
            {/* Key Details & Telemetry Modal                                 */}
            {/* ============================================================= */}
            {keyForDetails && (
                <Modal
                    title={`API Key Details: ${keyForDetails.name}`}
                    onClose={handleCloseDetailsModal}
                >
                    <div className="key-details-modal-body">
                        {detailsError && (
                            <Alert
                                type="error"
                                message={detailsError}
                                onDismiss={() => setDetailsError("")}
                            />
                        )}

                        {loadingDetails ? (
                            <div className="user-keys-loading">
                                <RefreshCw size={18} className="spin" />
                                <p>Loading telemetry data…</p>
                            </div>
                        ) : detailedData ? (
                            <>
                                {/* Overview Grid */}
                                <div className="key-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label"><FolderKanban size={13} /> Project</span>
                                        <strong>{detailedData.project_name}</strong>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label"><Building2 size={13} /> Organization</span>
                                        <strong>{detailedData.organization_name}</strong>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label"><KeyRound size={13} /> Identifier</span>
                                        <code>{detailedData.masked_key}</code>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label"><Calendar size={13} /> Assigned / Created</span>
                                        <span>{dateLabel(detailedData.created_date)}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label"><Clock size={13} /> Expires</span>
                                        <span>{detailedData.expiry_date ? dateLabel(detailedData.expiry_date) : "Never"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label"><Activity size={13} /> Last Used</span>
                                        <span>{detailedData.last_used_date ? dateLabel(detailedData.last_used_date) : "Never"}</span>
                                    </div>
                                </div>

                                {/* Scopes */}
                                <div className="key-details-scopes">
                                    <span className="detail-label">Granted Permissions:</span>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                                        {detailedData.scopes.map((s) => (
                                            <span key={s} className="scope-chip">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Telemetry Metrics */}
                                <div className="key-telemetry-header">
                                    <h3>Usage & Telemetry</h3>
                                </div>

                                <div className="key-telemetry-metrics">
                                    <div className="telemetry-card">
                                        <span>Total Requests</span>
                                        <strong>{detailedData.usage_count}</strong>
                                    </div>
                                    <div className="telemetry-card success-card">
                                        <span>Successful (2xx/3xx)</span>
                                        <strong>{detailedData.successful_requests}</strong>
                                    </div>
                                    <div className="telemetry-card error-card">
                                        <span>Errors (4xx/5xx)</span>
                                        <strong>{detailedData.failed_requests}</strong>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="key-recent-activity-section">
                                    <h4>Recent Request Activity</h4>
                                    {!detailedData.recent_activity || detailedData.recent_activity.length === 0 ? (
                                        <p className="no-telemetry-text">
                                            No telemetry requests have been recorded for this key yet.
                                        </p>
                                    ) : (
                                        <div className="recent-activity-table-wrapper">
                                            <table className="recent-activity-table">
                                                <thead>
                                                    <tr>
                                                        <th>Method</th>
                                                        <th>Path</th>
                                                        <th>Status</th>
                                                        <th>Latency</th>
                                                        <th>Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detailedData.recent_activity.map((log) => (
                                                        <tr key={log.id}>
                                                            <td>
                                                                <span className={`method-pill method-${log.method.toLowerCase()}`}>
                                                                    {log.method}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <code>{log.path}</code>
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`status-pill ${
                                                                        log.status_code < 400
                                                                            ? "status-ok"
                                                                            : "status-err"
                                                                    }`}
                                                                >
                                                                    {log.status_code}
                                                                </span>
                                                            </td>
                                                            <td>{log.latency_ms} ms</td>
                                                            <td>{dateLabel(log.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={handleCloseDetailsModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
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
                    <div className="revoke-modal-body">
                        {revokeError && (
                            <Alert
                                type="error"
                                message={revokeError}
                                onDismiss={() => setRevokeError("")}
                            />
                        )}

                        <div className="reveal-warning-callout">
                            <AlertTriangle size={20} className="warning-icon" />
                            <div>
                                <strong>Permanent Credential Revocation</strong>
                                <p>
                                    Revoking this key is irreversible. Applications, scripts, and CI/CD pipelines
                                    using this credential will immediately receive <code>401 Unauthorized</code> responses.
                                </p>
                            </div>
                        </div>

                        <div className="revoke-target-card">
                            <strong>{keyToRevoke.name}</strong>
                            <code>{keyToRevoke.masked_key || `${keyToRevoke.key_prefix}••••••••`}</code>
                            <span>Project: {keyToRevoke.project_name} ({keyToRevoke.organization_name})</span>
                        </div>

                        <p className="revoke-confirmation-text">
                            Are you sure you want to revoke API key <strong>"{keyToRevoke.name}"</strong>?
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleCloseRevokeModal}
                                disabled={revoking}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="danger-button confirm-revoke-btn"
                                onClick={handleConfirmRevoke}
                                disabled={revoking}
                            >
                                <Ban size={15} style={{ marginRight: 6 }} />
                                {revoking ? "Revoking…" : "Yes, Revoke Key"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    );
}

export default ApiKeysPage;
