import { ShieldCheck, Users, Terminal, RefreshCw, LogOut, Copy } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { useClipboard } from "../../../hooks/useClipboard";

export function SettingsContent() {
    const { user, logout } = useAuth();
    const {
        selectedOrganization,
        projectId,
        refreshWorkspace,
        setNotice,
    } = useWorkspace();
    const { copiedText, copyToClipboard } = useClipboard();

    const curlCommand = `curl -X GET "http://127.0.0.1:8000/v1/projects/${
        projectId || "<project_id>"
    }/data" -H "X-API-Key: ak_live_your_api_key_secret"`;

    return (
        <div className="settings-grid">
            <section className="settings-card">
                <h3>
                    <ShieldCheck size={18} /> User Account & Authentication
                </h3>
                <div className="settings-row">
                    <span>Email address</span>
                    <strong>{user?.email}</strong>
                </div>
                <div className="settings-row">
                    <span>User ID</span>
                    <code>{user?.id}</code>
                </div>
                <div className="settings-row">
                    <span>Session Security</span>
                    <strong>JWT Access Token with Automatic Refresh Rotation</strong>
                </div>
            </section>

            <section className="settings-card">
                <h3>
                    <Users size={18} /> Organization & Role
                </h3>
                <div className="settings-row">
                    <span>Organization Name</span>
                    <strong>{selectedOrganization?.name ?? "None"}</strong>
                </div>
                <div className="settings-row">
                    <span>Slug</span>
                    <code>{selectedOrganization?.slug ?? "None"}</code>
                </div>
                <div className="settings-row">
                    <span>Assigned Role</span>
                    <strong>{selectedOrganization?.role ?? "None"}</strong>
                </div>
            </section>

            <section className="settings-card">
                <h3>
                    <Terminal size={18} /> Developer API Cheatsheet & Integration
                </h3>
                <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 10px" }}>
                    Integrate your client or server with the protected endpoint using any HTTP client:
                </p>
                <div className="code-snippet-box">
                    <code>
                        curl -X GET "http://127.0.0.1:8000/v1/projects/{projectId || "&lt;project_id&gt;"}/data" \<br />
                        &nbsp;&nbsp;-H "X-API-Key: ak_live_your_api_key_secret"
                    </code>
                    <button
                        className="copy-snippet-btn"
                        onClick={() =>
                            copyToClipboard(curlCommand, "cURL snippet", setNotice)
                        }
                    >
                        <Copy size={12} /> {copiedText === "cURL snippet" ? "Copied" : "Copy cURL"}
                    </button>
                </div>
            </section>

            <section className="settings-card">
                <h3>
                    <RefreshCw size={18} /> Workspace Actions
                </h3>
                <div className="action-row">
                    <button
                        className="secondary-button"
                        onClick={() => void refreshWorkspace()}
                    >
                        <RefreshCw size={15} /> Refresh Workspace
                    </button>
                    <button
                        className="secondary-button"
                        onClick={() => void logout()}
                    >
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </section>
        </div>
    );
}

export default SettingsContent;

