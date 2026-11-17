import { Plus, Users, FolderKanban } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SelectionBar } from "./SelectionBar";
import { Alert } from "../components/Alert";
import { useWorkspace } from "../hooks/useWorkspace";
import { CreateOrganizationModal } from "../features/organizations";
import { CreateProjectModal } from "../features/projects";
import { CreateKeyModal, CreatedKeyModal } from "../features/apiKeys";

export function MainLayout({ children }) {
    const {
        page,
        organizations,
        organizationId,
        projects,
        loading,
        error,
        setError,
        notice,
        setNotice,
        showOrganizationForm,
        setShowOrganizationForm,
        showProjectForm,
        setShowProjectForm,
        showKeyForm,
        setShowKeyForm,
        showCreatedKey,
        setShowCreatedKey,
    } = useWorkspace();

    return (
        <div className="app-shell">
            <Sidebar />

            <main className="main-area">
                <Topbar />

                <div className="page-content">
                    <Alert
                        type="error"
                        message={error}
                        onDismiss={() => setError("")}
                    />
                    <Alert
                        type="success"
                        message={notice}
                        onDismiss={() => setNotice("")}
                    />

                    <section className="welcome-section">
                        <div>
                            <p className="eyebrow">API ACCESS & KEY MANAGEMENT</p>
                            <h1>{page === "Overview" ? "Workspace Overview" : page}</h1>
                            <p className="page-subtitle">
                                Securely generate, scope, revoke, and monitor API keys backed by FastAPI & PostgreSQL.
                            </p>
                        </div>
                        <div className="header-actions">
                            <button
                                className="secondary-button"
                                onClick={() => setShowOrganizationForm(true)}
                            >
                                <Plus size={16} /> Organization
                            </button>
                            <button
                                className="primary-button"
                                disabled={!organizationId}
                                onClick={() => setShowProjectForm(true)}
                            >
                                <Plus size={17} /> New Project
                            </button>
                        </div>
                    </section>

                    <SelectionBar />

                    {!organizations.length && (
                        <section className="empty-workspace panel">
                            <div className="empty-icon">
                                <Users size={24} />
                            </div>
                            <h2>Create your first organization</h2>
                            <p>
                                Organizations represent your company or workspace. They hold your projects, team memberships, and API keys.
                            </p>
                            <button
                                className="primary-button"
                                onClick={() => setShowOrganizationForm(true)}
                            >
                                <Plus size={16} /> Create Organization
                            </button>
                        </section>
                    )}

                    {organizations.length > 0 && !projects.length && (
                        <section className="empty-workspace panel">
                            <div className="empty-icon">
                                <FolderKanban size={24} />
                            </div>
                            <h2>Create your first project</h2>
                            <p>
                                Projects compartmentalize your applications. Each project gets its own isolated set of API keys and request logs.
                            </p>
                            <button
                                className="primary-button"
                                disabled={!organizationId}
                                onClick={() => setShowProjectForm(true)}
                            >
                                <Plus size={16} /> Create Project
                            </button>
                        </section>
                    )}

                    {children}

                    {loading && <div className="loading-indicator">Updating…</div>}

                    <footer className="footer">
                        <span>Keyflow Platform · API Access & Key Management</span>
                        <span>Connected to FastAPI (Port 8000) & PostgreSQL</span>
                    </footer>
                </div>
            </main>

            {/* Modals */}
            {showOrganizationForm && (
                <CreateOrganizationModal
                    onClose={() => setShowOrganizationForm(false)}
                />
            )}
            {showProjectForm && (
                <CreateProjectModal
                    onClose={() => setShowProjectForm(false)}
                />
            )}
            {showKeyForm && (
                <CreateKeyModal
                    onClose={() => setShowKeyForm(false)}
                />
            )}
            {showCreatedKey && (
                <CreatedKeyModal
                    createdKey={showCreatedKey}
                    onClose={() => setShowCreatedKey(null)}
                />
            )}
        </div>
    );
}

export default MainLayout;

