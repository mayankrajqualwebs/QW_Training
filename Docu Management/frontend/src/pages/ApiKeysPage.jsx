import { Plus } from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { KeyList } from "../features/apiKeys/components/KeyList";
import { useNavigate } from "react-router-dom";

export function ApiKeysPage() {
    const {
        keys,
        activeKeys,
        revokedKeys,
        filteredKeys,
        keyFilter,
        setKeyFilter,
        keySearch,
        setKeySearch,
        projectId,
        setShowKeyForm,
        setTestingKey,
        setNotice,
        handleRevokeClick,
        triggerScrollToTester,
    } = useWorkspace();

    const navigate = useNavigate();

    return (
        <section className="panel">
            <div className="panel-heading">
                <div>
                    <h2>API Keys Management</h2>
                    <p>
                        Secrets are stored as cryptographic SHA-256 hashes. Plaintext keys are never preserved on the backend.
                    </p>
                </div>
                <button
                    className="primary-button compact"
                    disabled={!projectId}
                    onClick={() => setShowKeyForm(true)}
                >
                    <Plus size={15} /> Create API Key
                </button>
            </div>

            <div className="filter-bar">
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${keyFilter === "all" ? "active" : ""}`}
                        onClick={() => setKeyFilter("all")}
                    >
                        All ({keys.length})
                    </button>
                    <button
                        className={`filter-tab ${keyFilter === "active" ? "active" : ""}`}
                        onClick={() => setKeyFilter("active")}
                    >
                        Active ({activeKeys.length})
                    </button>
                    <button
                        className={`filter-tab ${keyFilter === "revoked" ? "active" : ""}`}
                        onClick={() => setKeyFilter("revoked")}
                    >
                        Revoked ({revokedKeys.length})
                    </button>
                </div>

                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                        className="search-input"
                        type="search"
                        placeholder="Search by key name or prefix…"
                        value={keySearch}
                        onChange={(e) => setKeySearch(e.target.value)}
                    />
                </div>
            </div>

            <KeyList
                keys={filteredKeys}
                onRevoke={handleRevokeClick}
                detailed
                onSelectForTest={(key) => {
                    setTestingKey("");
                    navigate("/workspace/overview");
                    triggerScrollToTester?.();
                    setNotice(
                        `Opened tester for "${key.name}". Paste its original API key secret to authenticate.`
                    );
                }}
            />
        </section>
    );
}

export default ApiKeysPage;

