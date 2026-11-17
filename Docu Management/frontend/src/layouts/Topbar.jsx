import { RefreshCw } from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";

export function Topbar() {
    const { page, refreshWorkspace } = useWorkspace();

    return (
        <header className="topbar">
            <div className="breadcrumb">
                Platform <span>/</span> <strong>{page}</strong>
            </div>
            <div className="topbar-right">
                <span className="online-pill healthy">
                    <i /> API Workspace
                </span>
                <button
                    className="icon-button"
                    title="Refresh data"
                    onClick={() => void refreshWorkspace()}
                >
                    <RefreshCw size={17} />
                </button>
            </div>
        </header>
    );
}

export default Topbar;

