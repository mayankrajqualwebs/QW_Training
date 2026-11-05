import { X } from "lucide-react";

export function Alert({ type = "error", message, onDismiss }) {
    if (!message) return null;

    const typeClass =
        type === "error"
            ? "alert-error"
            : type === "warning"
            ? "alert-warning"
            : "alert-success";

    return (
        <div className={`alert ${typeClass}`}>
            <span>{message}</span>
            {onDismiss && (
                <button onClick={onDismiss} aria-label={`Dismiss ${type}`}>
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

export default Alert;

