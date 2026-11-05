import { FolderKanban } from "lucide-react";

export function EmptyMessage({ message, icon: Icon = FolderKanban }) {
    return (
        <div className="empty-message">
            <Icon size={24} />
            <p>{message}</p>
        </div>
    );
}

export default EmptyMessage;

