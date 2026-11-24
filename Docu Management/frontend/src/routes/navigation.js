
import {
    LayoutDashboard,
    FolderKanban,
    KeyRound,
    BarChart3,
    ShieldCheck,
    Files,
    Users,
    Activity,
    MessageSquare,
    Settings,
} from "lucide-react";

export const userNavigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Projects", icon: FolderKanban },
    { label: "Documents", icon: Files },
    { label: "AI Assistant", icon: MessageSquare },
    { label: "API Access", icon: KeyRound },
    { label: "Analytics", icon: BarChart3 },
    { label: "Settings", icon: Settings },
];

export const adminNavigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "User Management", icon: Users },
    { label: "Project Management", icon: FolderKanban },
    { label: "Document Management", icon: Files },
    { label: "API Key Management", icon: KeyRound },
    { label: "API Monitoring", icon: Activity },
];
