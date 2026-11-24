
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Sidebar({
    title,
    subtitle,
    navigation,
    activePage,
    onNavigate,
    accent = "blue",
    children,
}) {
    const { user, logout } = useAuth();

    return (
        <aside className={`sidebar sidebar-${accent}`}>
            <div className="brand">
                <div className="brand-mark">
                    {/* Add product logo here */}
                </div>

                <div>
                    <strong>{title}</strong>
                    <small>{subtitle}</small>
                </div>
            </div>

            {children}

            <div className="side-label">NAVIGATION</div>

            <nav className="side-nav">
                {navigation.map(({ label, icon: Icon, count }) => (
                    <button
                        key={label}
                        className={
                            activePage === label
                                ? "side-link selected"
                                : "side-link"
                        }
                        onClick={() => onNavigate(label)}
                    >
                        <Icon size={18} />
                        <span>{label}</span>

                        {count !== undefined && count !== null && (
                            <span className="nav-count">{count}</span>
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
                        <small>{user?.platform_role}</small>
                    </div>
                </div>

                <button
                    className="side-link logout-link"
                    onClick={() => void logout()}
                >
                    <LogOut size={18} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
