
export function MainLayout({
    sidebar,
    topbar,
    children,
    theme = "blue",
}) {
    return (
        <div className={`app-shell app-shell-${theme}`}>
            {sidebar}

            <main className="main-area">
                {topbar}

                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default MainLayout;
