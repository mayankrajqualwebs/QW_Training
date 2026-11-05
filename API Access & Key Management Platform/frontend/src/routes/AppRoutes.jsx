import { useWorkspace } from "../hooks/useWorkspace";
import { OverviewPage } from "../pages/OverviewPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ApiKeysPage } from "../pages/ApiKeysPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { SettingsPage } from "../pages/SettingsPage";

export function AppRoutes() {
    const { page } = useWorkspace();

    switch (page) {
        case "Overview":
            return <OverviewPage />;
        case "Projects":
            return <ProjectsPage />;
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

