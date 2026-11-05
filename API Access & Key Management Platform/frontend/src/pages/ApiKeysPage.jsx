import { Plus } from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { KeyList } from "../features/apiKeys/components/KeyList";

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
        revokeKey,
        setTestingKey,
        setPage,
        setNotice,
    } = useWorkspace();

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
                onRevoke={revokeKey}
                detailed
                onSelectForTest={async (key) => {
                    const fullKey = key.api_key ?? null;
                    if (fullKey) {
                      setTestingKey(fullKey);
                      setPage("Overview");
                      setNotice(`Loaded full API key into tester. Running test...`);
                      try {
                        await testProtectedApi(fullKey);
                      } catch (e) {
                        // error handling is done in context
                      }
                    } else {
                      setTestingKey(key.key_prefix);
                      setPage("Overview");
                      setNotice(`Loaded key prefix "${key.key_prefix}" into tester. Full key not available – please paste it into the tester.`);
                      // Do not auto‑run test because prefix is insufficient
                    }
                }}
            />
        </section>
    );
}

export default ApiKeysPage;

