
import { RefreshCw } from "lucide-react";

export function Topbar({
    section = "Platform",
    page,
    onRefresh,
    refreshing = false,
}) {
    return (
        <header className="topbar">
            <div className="breadcrumb">
                {section} <span>/</span> <strong>{page}</strong>
            </div>

            <div className="topbar-right">
                <span className="online-pill healthy">
                    <i /> Connected
                </span>

                {onRefresh && (
                    <button
                        className="icon-button"
                        title="Refresh data"
                        onClick={onRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "spin" : ""}
                        />
                    </button>
                )}
            </div>
        </header>
    );
}

export default Topbar;
