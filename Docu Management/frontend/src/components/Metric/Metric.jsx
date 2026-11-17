export function Metric({ title, value, icon }) {
    return (
        <div className="metric-card">
            <div className="metric-top">
                <span>{title}</span>
                <span className="metric-icon">{icon}</span>
            </div>
            <div className="metric-value">{value === undefined ? "—" : value}</div>
            <div className="metric-note">{value === undefined ? "Select a project" : "Live telemetry"}</div>
        </div>
    );
}

export default Metric;

