
import {
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { WorkspaceProvider } from "../context/WorkspaceProvider";

import { UserLayout } from "../layouts/UserLayout";
import { AdminLayout } from "../layouts/AdminLayout";

import { OverviewPage } from "../pages/OverviewPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { FilesPage } from "../pages/FilesPage";
import { ApiKeysPage } from "../pages/ApiKeysPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { AdminOverviewPage } from "../pages/AdminOverviewPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";

function RoleRedirect() {
    const { user } = useAuth();

    if (user?.platform_role === "ADMIN") {
        return <Navigate to="/admin/overview" replace />;
    }

    if (user?.platform_role === "USER") {
        return <Navigate to="/workspace/overview" replace />;
    }

    return <div>Unable to determine your account role. Please contact support.</div>;
}

function UnknownRole() {
    return (
        <div className="screen-center">
            <h2>Account role not recognized</h2>
            <p>
                Your account does not have a valid platform role.
                Please contact support.
            </p>
        </div>
    );
}

function UserRoute() {
    const { user } = useAuth();

    if (user?.platform_role === "ADMIN") {
        return <Navigate to="/admin/overview" replace />;
    }

    if (user?.platform_role !== "USER") {
        return <UnknownRole />;
    }

    return (
        <WorkspaceProvider>
            <UserLayout>
                <Outlet />
            </UserLayout>
        </WorkspaceProvider>
    );
}

function AdminRoute() {
    const { user } = useAuth();

    if (user?.platform_role === "USER") {
        return <Navigate to="/workspace/overview" replace />;
    }

    if (user?.platform_role !== "ADMIN") {
        return <UnknownRole />;
    }

    return <AdminLayoutRoute />;
}

function AdminLayoutRoute() {
    const location = useLocation();
    const navigate = useNavigate();

    const adminPages = {
        "/admin/overview": "Overview",
        "/admin/users": "User Management",
        "/admin/projects": "Project Management",
        "/admin/documents": "Document Management",
        "/admin/api-keys": "API Key Management",
        "/admin/monitoring": "API Monitoring",
    };

    const page = adminPages[location.pathname] ?? "Overview";

    const adminPaths = {
        Overview: "/admin/overview",
        "User Management": "/admin/users",
        "Project Management": "/admin/projects",
        "Document Management": "/admin/documents",
        "API Key Management": "/admin/api-keys",
        "API Monitoring": "/admin/monitoring",
    };

    return (
        <AdminLayout
            page={page}
            onNavigate={(label) => navigate(adminPaths[label])}
        >
            <Outlet />
        </AdminLayout>
    );
}

function AdminPlaceholder({ title }) {
    return (
        <section className="panel empty-workspace">
            <h2>{title}</h2>
            <p>
                This section is planned and will be implemented
                as part of the Admin Console.
            </p>
        </section>
    );
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<RoleRedirect />} />

            <Route path="/workspace" element={<UserRoute />}>
                <Route
                    index
                    element={<Navigate to="overview" replace />}
                />

                <Route path="overview" element={<OverviewPage />} />
                <Route path="projects" element={<ProjectsPage />} />

                {/* Existing FilesPage serves as Documents for now */}
                <Route path="documents" element={<FilesPage />} />

                {/* Placeholder until AI Assistant is implemented */}
                {/* User Workspace */}
                <Route
                    path="ai-assistant"
                    element={
                        <PlaceholderPage
                            title="AI Assistant"
                            description="Search your documents, ask questions, and get AI-powered insights. This feature is coming soon."
                        />
                    }
                />

                {/* Existing ApiKeysPage serves as API Access for now */}
                <Route path="api-access" element={<ApiKeysPage />} />

                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>


            <Route path="/admin" element={<AdminRoute />}>
                <Route
                    path="overview"
                    element={<AdminOverviewPage />}
                />
                <Route
                    path="users" element={<AdminUsersPage />}
                />
                <Route
                    path="projects"
                    element={<PlaceholderPage title="Project Management" />}
                />
                <Route
                    path="documents"
                    element={<PlaceholderPage title="Document Management" />}
                />
                <Route
                    path="api-keys"
                    element={<PlaceholderPage title="API Key Management" />}
                />
                <Route
                    path="monitoring"
                    element={<PlaceholderPage title="API Monitoring" />}
                />
            </Route>

            <Route path="*" element={<RoleRedirect />} />
        </Routes>
    );
}

export default AppRoutes;
