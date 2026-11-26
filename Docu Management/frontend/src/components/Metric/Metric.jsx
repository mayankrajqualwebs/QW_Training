
export function Metric({
    title,
    value,
    icon,
    note = "Live telemetry",
}) {
    return (
        <div className="metric-card">
            <div className="metric-top">
                <span>{title}</span>
                <span className="metric-icon">{icon}</span>
            </div>

            <div className="metric-value">
                {value === undefined || value === null
                    ? "—"
                    : value.toLocaleString()}
            </div>

            <div className="metric-note">{note}</div>
        </div>
    );
}

export default Metric;
