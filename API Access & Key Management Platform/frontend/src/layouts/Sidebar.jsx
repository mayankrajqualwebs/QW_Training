import { KeyRound, Plus, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import { navigation } from "../routes/navigation";

export function Sidebar() {
    const { user, logout } = useAuth();
    const {
        page,
        setPage,
        organizations,
        organizationId,
        setOrganizationId,
        selectedOrganization,
        projects,
        activeKeys,
        setShowOrganizationForm,
    } = useWorkspace();

    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-mark">
                    <KeyRound size={22} />
                </div>
                <div>
                    <strong>Keyflow</strong>
                    <small>API ACCESS PLATFORM</small>
                </div>
            </div>

            <div className="side-label">ORGANIZATION</div>
            <select
                className="workspace-select"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                aria-label="Select organization"
            >
                <option value="">Select organization</option>
                {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                        {org.name} · {org.role}
                    </option>
                ))}
            </select>
            <button
                className="side-create"
                onClick={() => setShowOrganizationForm(true)}
            >
                <Plus size={16} /> New organization
            </button>

            <div className="side-label">NAVIGATION</div>
            <nav className="side-nav">
                {navigation.map(({ label, icon: Icon }) => (
                    <button
                        key={label}
                        className={page === label ? "side-link selected" : "side-link"}
                        onClick={() => setPage(label)}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                        {label === "API Keys" && activeKeys.length > 0 && (
                            <span className="nav-count">{activeKeys.length}</span>
                        )}
                        {label === "Projects" && projects.length > 0 && (
                            <span className="nav-count">{projects.length}</span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="signed-user">
                    <div className="avatar">
                        {user?.email?.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="signed-user-info">
                        <strong>{user?.email}</strong>
                        <small>{selectedOrganization?.role ?? "Developer"}</small>
                    </div>
                </div>
                <button
                    className="side-link logout-link"
                    onClick={() => void logout()}
                >
                    <LogOut size={18} /> Sign out
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;

