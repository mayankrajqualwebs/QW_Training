
import { MainLayout } from "./MainLayout";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { adminNavigation } from "../routes/navigation";

export function AdminLayout({
    children,
    page = "Overview",
    onNavigate,
    onRefresh,
    refreshing = false,
}) {
    const sidebar = (
        <Sidebar
            title="Your Product"
            subtitle="ADMIN CONSOLE"
            navigation={adminNavigation}
            activePage={page}
            onNavigate={onNavigate}
            accent="teal"
        />
    );

    const topbar = (
        <Topbar
            section="Admin Console"
            page={page}
            onRefresh={onRefresh}
            refreshing={refreshing}
        />
    );

    return (
        <MainLayout
            sidebar={sidebar}
            topbar={topbar}
            theme="teal"
        >
            <section className="welcome-section">
                <div>
                    <p className="eyebrow">ADMIN CONSOLE</p>
                    <h1>{page}</h1>
                    <p className="page-subtitle">
                        Monitor and manage your platform, users, documents,
                        projects, and API activity.
                    </p>
                </div>
            </section>

            {children}
        </MainLayout>
    );
}

export default AdminLayout;
