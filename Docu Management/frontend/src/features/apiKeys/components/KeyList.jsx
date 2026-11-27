import { useState } from "react";
import {
    KeyRound,
    Copy,
    Check,
    Trash2,
    Eye,
    Info,
    Activity,
    ShieldAlert,
    Building2,
    FolderKanban,
} from "lucide-react";
import { dateLabel } from "../../../utils/date";
import { EmptyMessage } from "../../../components/EmptyMessage";

export function KeyList({
    keys = [],
    onRevoke,
    detailed = true,
    onSelectForTest,
    onReveal,
    onViewDetails,
}) {
    const [copiedPrefixId, setCopiedPrefixId] = useState(null);

    if (!keys.length) {
        return <EmptyMessage message="No API keys match your criteria." />;
    }

    const handleCopyPrefix = (key) => {
        const textToCopy = key.key_prefix || "";
        void navigator.clipboard.writeText(textToCopy);
        setCopiedPrefixId(key.id);
        setTimeout(() => setCopiedPrefixId(null), 2000);
    };

    return (
        <div className="key-list">
            {keys.map((key) => {
                const keyStatus = key.status || (key.revoked_at ? "revoked" : "active");
                const isRevoked = keyStatus === "revoked" || Boolean(key.revoked_at);
                const isExpired = keyStatus === "expired";
                const isActive = !isRevoked && !isExpired;

                return (
                    <div className="key-row" key={key.id}>
                        <div className="key-icon">
                            <KeyRound size={18} />
                        </div>

                        <div className="key-info">
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <strong>{key.name}</strong>

                                {/* Project & Organization badge */}
                                {(key.project_name || key.organization_name) && (
                                    <span className="key-project-badge" title="Project & Organization">
                                        <FolderKanban size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                                        {key.project_name || "Project"}
                                        {key.organization_name ? ` • ${key.organization_name}` : ""}
                                    </span>
                                )}

                                {/* Status Badge */}
                                <span className={`state ${keyStatus}`}>
                                    {keyStatus.charAt(0).toUpperCase() + keyStatus.slice(1)}
                                </span>

                                {/* Pending Reveal Pill */}
                                {key.can_reveal && isActive && (
                                    <span className="key-reveal-pill" title="Raw secret is ready for one-time retrieval">
                                        <ShieldAlert size={11} style={{ marginRight: 3 }} />
                                        Secret Ready
                                    </span>
                                )}

                                {/* Telemetry / Usage Count */}
                                {key.usage_count !== undefined && (
                                    <span
                                        className="key-usage-count"
                                        title={`${key.successful_requests || 0} successful, ${key.failed_requests || 0} failed requests`}
                                    >
                                        <Activity size={11} style={{ marginRight: 3 }} />
                                        {key.usage_count === 0 ? "No usage recorded" : `${key.usage_count} reqs`}
                                    </span>
                                )}
                            </div>

                            {/* Masked Prefix & Suffix Code */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <code>
                                    {key.masked_key || `${key.key_prefix || "ak_live_"}••••••••${key.key_suffix || ""}`}
                                </code>

                                <button
                                    className="icon-button"
                                    style={{ width: 22, height: 22 }}
                                    title="Copy Prefix"
                                    type="button"
                                    onClick={() => handleCopyPrefix(key)}
                                >
                                    {copiedPrefixId === key.id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                                </button>
                            </div>

                            {/* Scopes */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {(key.scopes || []).map((s) => (
                                    <span key={s} className="scope-chip">
                                        {s}
                                    </span>
                                ))}
                            </div>

                            {/* Detailed dates */}
                            {detailed && (
                                <small style={{ color: "#94a3b8" }}>
                                    Created: {dateLabel(key.created_date || key.created_at)}
                                    {" · "}
                                    Expires: {key.expiry_date || key.expires_at ? dateLabel(key.expiry_date || key.expires_at) : "Never"}
                                    {" · "}
                                    Last used: {key.last_used_date || key.last_used_at ? dateLabel(key.last_used_date || key.last_used_at) : "Never"}
                                </small>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="key-actions">
                            {/* Reveal Secret Button */}
                            {onReveal && key.can_reveal && isActive && (
                                <button
                                    className="primary-button compact key-reveal-btn"
                                    title="Securely reveal and copy raw secret"
                                    type="button"
                                    onClick={() => onReveal(key)}
                                >
                                    <Eye size={13} style={{ marginRight: 4 }} />
                                    Reveal Key
                                </button>
                            )}

                            {/* View Details Button */}
                            {onViewDetails && (
                                <button
                                    className="secondary-button compact"
                                    title="Inspect key details and telemetry"
                                    type="button"
                                    onClick={() => onViewDetails(key)}
                                >
                                    <Info size={13} style={{ marginRight: 4 }} />
                                    Details
                                </button>
                            )}

                            {/* Test Button */}
                            {onSelectForTest && (
                                <button
                                    className="secondary-button compact"
                                    title="Use in API Tester"
                                    type="button"
                                    onClick={() => onSelectForTest(key)}
                                >
                                    Test
                                </button>
                            )}

                            {/* Revoke Button (only for active keys assigned to user) */}
                            {isActive && onRevoke && (
                                <button
                                    className="icon-button danger-button"
                                    title="Revoke API key"
                                    type="button"
                                    onClick={() => onRevoke(key)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default KeyList;
