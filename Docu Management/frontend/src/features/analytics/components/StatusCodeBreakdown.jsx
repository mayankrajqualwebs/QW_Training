export function StatusCodeBreakdown({ breakdown, totalRequests = 0, variant = "pills" }) {
    const entries = Object.entries(breakdown || {});

    if (variant === "cards") {
        return (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: 12,
                }}
            >
                {entries.map(([code, count]) => {
                    const pct =
                        totalRequests > 0
                            ? ((count / totalRequests) * 100).toFixed(1)
                            : "0";
                    const is2xx = code.startsWith("2");
                    const is4xx = code.startsWith("4");
                    return (
                        <div className="breakdown-card" key={code}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: is2xx ? "#059669" : is4xx ? "#d97706" : "#dc2626",
                                    }}
                                >
                                    HTTP {code}
                                </span>
                                <span style={{ fontSize: 11, color: "#64748b" }}>{pct}%</span>
                            </div>
                            <strong style={{ fontSize: 16 }}>{count} calls</strong>
                            <div className="breakdown-bar-bg">
                                <div
                                    className="breakdown-bar-fill"
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: is2xx
                                            ? "#10b981"
                                            : is4xx
                                            ? "#f59e0b"
                                            : "#ef4444",
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
                {!entries.length && (
                    <p style={{ color: "#94a3b8", fontSize: 12 }}>
                        No request logs recorded in this period.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="status-breakdown">
            {entries.map(([code, count]) => (
                <div key={code}>
                    <span>HTTP {code}</span>
                    <strong>{count}</strong>
                </div>
            ))}
            {!entries.length && <p>No API calls recorded in this time window.</p>}
        </div>
    );
}

export default StatusCodeBreakdown;

