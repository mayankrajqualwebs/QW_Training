import { KeyRound, Copy, Trash2 } from "lucide-react";
import { dateLabel } from "../../../utils/date";
import { EmptyMessage } from "../../../components/EmptyMessage";

export function KeyList({
    keys,
    onRevoke,
    detailed = false,
    onSelectForTest,
}) {
    if (!keys.length) {
        return <EmptyMessage message="No API keys match your criteria." />;
    }

    return (
        <div className="key-list">
            {keys.map((key) => (
                <div className="key-row" key={key.id}>
                    <div className="key-icon">
                        <KeyRound size={18} />
                    </div>
                    <div className="key-info">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <strong>{key.name}</strong>
                            <span className={`state ${key.revoked_at ? "revoked" : "active"}`}>
                                {key.revoked_at ? "Revoked" : "Active"}
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <code>{key.key_prefix}••••••••</code>
                            <button
                                className="icon-button"
                                style={{ width: 22, height: 22 }}
                                title="Copy Prefix"
                                onClick={() => {
                                    void navigator.clipboard.writeText(key.key_prefix);
                                }}
                            >
                                <Copy size={11} />
                            </button>
                        </div>
                        <div>
                            {key.scopes.map((s) => (
                                <span key={s} className="scope-chip">
                                    {s}
                                </span>
                            ))}
                        </div>
                        {detailed && (
                            <small style={{ color: "#94a3b8" }}>
                                Created: {dateLabel(key.created_at)} · Expires: {dateLabel(key.expires_at)} · Last used: {dateLabel(key.last_used_at)}
                            </small>
                        )}
                    </div>
                    <div className="key-actions">
                        {onSelectForTest && !key.revoked_at && (
                            <button
                                className="secondary-button compact"
                                title="Use in API Tester"
                                onClick={() => onSelectForTest(key)}
                            >
                                Test
                            </button>
                        )}
                        {!key.revoked_at && onRevoke && (
                            <button
                                className="icon-button danger-button"
                                title="Revoke API key"
                                onClick={() => onRevoke(key)}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default KeyList;

