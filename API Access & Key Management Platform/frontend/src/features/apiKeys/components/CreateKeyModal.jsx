import { useState } from "react";
import { Modal } from "../../../components/Modal";
import { useWorkspace } from "../../../hooks/useWorkspace";

const AVAILABLE_SCOPES = [
    { id: "data:read", label: "data:read", desc: "Read project data and protected resources" },
    { id: "data:write", label: "data:write", desc: "Write or update project datasets" },
    { id: "usage:read", label: "usage:read", desc: "Read key usage metrics and rate limits" },
];

export function CreateKeyModal({ onClose }) {
    const { createKey, loading, projectId } = useWorkspace();
    const [name, setName] = useState("");
    const [scopes, setScopes] = useState(["data:read"]);
    const [expiry, setExpiry] = useState("30");

    function toggleScope(scope) {
        setScopes((items) =>
            items.includes(scope)
                ? items.filter((item) => item !== scope)
                : [...items, scope]
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!projectId) return;

        const expiresAt =
            expiry === "never"
                ? null
                : new Date(Date.now() + Number(expiry) * 86400000).toISOString();

        try {
            await createKey({
                name: name.trim(),
                scopes,
                expires_at: expiresAt,
            });
            onClose();
        } catch {
            // Error is handled in context
        }
    }

    return (
        <Modal title="Create New API Key" onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <label>API Key Name</label>
                <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Production Ingestion Worker"
                />

                <label>Permissions & Scopes</label>
                {AVAILABLE_SCOPES.map((scope) => (
                    <label className="scope-option" key={scope.id}>
                        <input
                            type="checkbox"
                            checked={scopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                        />
                        <span>
                            <strong>{scope.label}</strong>
                            <small>{scope.desc}</small>
                        </span>
                    </label>
                ))}

                <label>Expiration Preset</label>
                <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                    <option value="7">7 days</option>
                    <option value="30">30 days (Recommended)</option>
                    <option value="90">90 days</option>
                    <option value="never">No Expiration</option>
                </select>

                {scopes.length === 0 && (
                    <p className="field-error">Please select at least one permission scope.</p>
                )}
                <button
                    className="primary-button full-width"
                    disabled={loading || !scopes.length || !projectId}
                >
                    Generate API Key
                </button>
            </form>
        </Modal>
    );
}

export default CreateKeyModal;

