import { useWorkspace } from "../hooks/useWorkspace";
import { EmptyMessage } from "../components/EmptyMessage";
import { AnalyticsChart } from "../features/analytics/components/AnalyticsChart";
import { StatusCodeBreakdown } from "../features/analytics/components/StatusCodeBreakdown";

export function AnalyticsPage() {
    const { summary, days, setDays, selectedProject } = useWorkspace();

    const chartData = summary
        ? [
              { name: "Successful", requests: summary.successful_requests },
              { name: "Errors", requests: summary.error_requests },
          ]
        : [];

    return (
        <section className="panel">
            <div className="panel-heading">
                <div>
                    <h2>Usage Analytics & Monitoring</h2>
                    <p>
                        Aggregated telemetry for project:{" "}
                        {selectedProject?.name ?? "None selected"}
                    </p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                </select>
            </div>

            {summary ? (
                <>
                    <div className="analytics-details large">
                        <div>
                            <span>Total Requests</span>
                            <strong style={{ fontSize: 20 }}>
                                {summary.total_requests}
                            </strong>
                        </div>
                        <div>
                            <span>Successful Requests</span>
                            <strong style={{ fontSize: 20, color: "#10b981" }}>
                                {summary.successful_requests}
                            </strong>
                        </div>
                        <div>
                            <span>Error Requests</span>
                            <strong
                                style={{
                                    fontSize: 20,
                                    color: summary.error_requests > 0 ? "#ef4444" : "#64748b",
                                }}
                            >
                                {summary.error_requests}
                            </strong>
                        </div>
                        <div>
                            <span>Error Rate</span>
                            <strong style={{ fontSize: 20 }}>
                                {summary.error_rate_percent.toFixed(2)}%
                            </strong>
                        </div>
                        <div>
                            <span>Average Latency</span>
                            <strong style={{ fontSize: 20 }}>
                                {summary.average_latency_ms.toFixed(1)} ms
                            </strong>
                        </div>
                        <div>
                            <span>Monitored Window</span>
                            <strong style={{ fontSize: 20 }}>
                                {summary.period_days} days
                            </strong>
                        </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <h3 className="subheading">Request Volume Over Period</h3>
                        <AnalyticsChart
                            data={chartData}
                            gradientId="analyticsFill"
                            strokeColor="#4f46e5"
                            height={240}
                        />
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <h3 className="subheading">HTTP Status Codes Breakdown</h3>
                        <StatusCodeBreakdown
                            breakdown={summary.status_code_breakdown}
                            totalRequests={summary.total_requests}
                            variant="cards"
                        />
                    </div>
                </>
            ) : (
                <EmptyMessage message="Select a project to load usage telemetry and request breakdown." />
            )}
        </section>
    );
}

export default AnalyticsPage;

