import { useLocation, useNavigate } from "react-router-dom";
import { Users, FolderKanban } from "lucide-react";

import { MainLayout } from "./MainLayout";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SelectionBar } from "./SelectionBar";

import { Alert } from "../components/Alert";
import { useWorkspace } from "../hooks/useWorkspace";
import { userNavigation } from "../routes/navigation";

export function UserLayout({ children }) {
    const {
        organizations,
        organizationId,
        selectOrganization,
        projects,
        activeKeys,
        loading,
        error,
        setError,
        notice,
        setNotice,
        refreshWorkspace,
    } = useWorkspace();

    const location = useLocation();
    const navigate = useNavigate();

    const pageByPath = {
        "/workspace/overview": "Overview",
        "/workspace/projects": "Projects",
        "/workspace/documents": "Documents",
        "/workspace/ai-assistant": "AI Assistant",
        "/workspace/api-access": "API Access",
        "/workspace/analytics": "Analytics",
        "/workspace/settings": "Settings",
    };

    const pathByPage = {
        Overview: "/workspace/overview",
        Projects: "/workspace/projects",
        Documents: "/workspace/documents",
        "AI Assistant": "/workspace/ai-assistant",
        "API Access": "/workspace/api-access",
        Analytics: "/workspace/analytics",
        Settings: "/workspace/settings",
    };

    const page = pageByPath[location.pathname] ?? "Overview";

    const navigation = userNavigation.map((item) => ({
        ...item,
        count:
            item.label === "Projects"
                ? projects.length
                : item.label === "API Access"
                    ? activeKeys.length
                    : undefined,
    }));

    const sidebar = (
        <Sidebar
            title="Your Product"
            subtitle="USER WORKSPACE"
            navigation={navigation}
            activePage={page}
            onNavigate={(label) => {
                const path = pathByPage[label];

                if (path) {
                    navigate(path);
                }
            }}
            accent="blue"
        >
            <div className="side-label">ORGANIZATION</div>

            <select
                className="workspace-select"
                value={organizationId}
                onChange={(event) =>
                    selectOrganization(event.target.value)
                }
                aria-label="Select organization"
            >
                <option value="">Select organization</option>

                {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                        {org.name} · {org.role}
                    </option>
                ))}
            </select>
        </Sidebar>
    );

    const topbar = (
        <Topbar
            section="Workspace"
            page={page}
            onRefresh={refreshWorkspace}
            refreshing={loading}
        />
    );

    return (
        <>
            <MainLayout theme="blue" sidebar={sidebar} topbar={topbar}>
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
                        <p className="eyebrow">USER WORKSPACE</p>

                        <h1>
                            {page === "Overview"
                                ? "Workspace Overview"
                                : page}
                        </h1>

                        <p className="page-subtitle">
                            Manage your projects, documents, and API resources
                            from one workspace.
                        </p>
                    </div>
                    {page === "Projects" && !organizations.length && (
                        <section className="empty-workspace panel">
                            <div className="empty-icon">
                                <Users size={24} />
                            </div>

                            <h2>No organization assigned</h2>

                            <p>
                                You haven't been added to an organization yet.
                                Contact your administrator to get access.
                            </p>
                        </section>
                    )}
                </section>

                <SelectionBar />

                {page === "Projects" && !organizations.length && (
                    <section className="empty-workspace panel">
                        <div className="empty-icon">
                            <Users size={24} />
                        </div>

                        <h2>Create your first organization</h2>

                        <p>
                            Organizations represent your company or workspace.
                            They hold your projects and team memberships.
                        </p>

                        <button
                            className="primary-button"
                            onClick={() => setShowOrganizationForm(true)}
                        >
                            <Plus size={16} />
                            Create Organization
                        </button>
                    </section>
                )}

                {page === "Projects" &&
                    organizations.length > 0 &&
                    !projects.length && (
                        <section className="empty-workspace panel">
                            <div className="empty-icon">
                                <FolderKanban size={24} />
                            </div>

                            <h2>No projects assigned</h2>

                            <p>
                                No projects are currently available in this organization.
                                Contact your administrator if you need project access.
                            </p>
                        </section>
                    )}

                {children}

                {loading && (
                    <div className="loading-indicator">
                        Loading workspace…
                    </div>
                )}
            </MainLayout>
        </>
    );
}

export default UserLayout;