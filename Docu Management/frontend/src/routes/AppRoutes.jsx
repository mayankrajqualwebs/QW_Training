import { useWorkspace } from "../hooks/useWorkspace";
import { OverviewPage } from "../pages/OverviewPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ApiKeysPage } from "../pages/ApiKeysPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { FilesPage } from "../pages/FilesPage";

export function AppRoutes() {
    const { page } = useWorkspace();

    switch (page) {
        case "Overview":
            return <OverviewPage />;
        case "Projects":
            return <ProjectsPage />;
        case "Files":
            return <FilesPage />;
        case "API Keys":
            return <ApiKeysPage />;
        case "Analytics":
            return <AnalyticsPage />;
        case "Settings":
            return <SettingsPage />;
        default:
            return <OverviewPage />;
    }
}

export default AppRoutes;

