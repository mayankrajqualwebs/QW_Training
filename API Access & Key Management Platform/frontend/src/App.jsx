import { RefreshCw } from "lucide-react";
import { AuthProvider } from "./context/AuthProvider";
import { WorkspaceProvider } from "./context/WorkspaceProvider";
import { useAuth } from "./hooks/useAuth";
import { AuthScreen } from "./features/authentication";
import { MainLayout } from "./layouts/MainLayout";
import { AppRoutes } from "./routes/AppRoutes";
import "./styles/App.css";

function AppContent() {
    const { user, authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="screen-center">
                <RefreshCw size={24} className="spin" />
                <p>Restoring your session…</p>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    return (
        <WorkspaceProvider>
            <MainLayout>
                <AppRoutes />
            </MainLayout>
        </WorkspaceProvider>
    );
}

export function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
