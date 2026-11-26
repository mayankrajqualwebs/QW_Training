
import { useWorkspace } from "../hooks/useWorkspace";
import {
    Activity,
    KeyRound,
    FolderKanban,
    ShieldCheck,
} from "lucide-react";
import { Metric } from "../components/Metric";
import { EmptyMessage } from "../components/EmptyMessage";
import { AnalyticsChart } from "../features/analytics/components/AnalyticsChart";
import { StatusCodeBreakdown } from "../features/analytics/components/StatusCodeBreakdown";
import { KeyList } from "../features/apiKeys/components/KeyList";
import { ApiTester } from "../features/apiKeys/components/ApiTester";
import { useNavigate } from "react-router-dom";

export function OverviewPage() {
    const {
        summary,
        days,
        setDays,
        activeKeys,
        projects,
        projectId,
        selectedProject,
        keys,
        setTestingKey,
        triggerScrollToTester,
        setNotice,
    } = useWorkspace();

    const navigate = useNavigate();

    const chartData = summary
        ? [
            {
                name: "Successful",
                requests: summary.successful_requests,
            },
            {
                name: "Errors",
                requests: summary.error_requests,
            },
        ]
        : [];

    return (
        <>
            <section className="metrics-grid">
                <Metric
                    title="Total Requests"
                    value={summary?.total_requests}
                    icon={<Activity size={18} />}
                />

                <Metric
                    title="Assigned API Keys"
                    value={activeKeys.length}
                    icon={<KeyRound size={18} />}
                />

                <Metric
                    title="Projects"
                    value={projects.length}
                    icon={<FolderKanban size={18} />}
                />

                <Metric
                    title="Error Rate"
                    value={
                        summary
                            ? `${summary.error_rate_percent.toFixed(2)}%`
                            : undefined
                    }
                    icon={<ShieldCheck size={18} />}
                />
            </section>

            <section className="two-column">
                {/* Request Traffic */}
                <div className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Request Traffic</h2>
                            <p>
                                Analytics for{" "}
                                {selectedProject?.name ?? "selected project"}
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
                            <div className="analytics-highlight">
                                <strong>
                                    {summary.total_requests.toLocaleString()}
                                </strong>
                                <span>
                                    total requests over the last{" "}
                                    {summary.period_days} days
                                </span>
                            </div>

                            <AnalyticsChart
                                data={chartData}
                                gradientId="requestsFill"
                                strokeColor="#3978e8"
                                height={210}
                            />

                            <div className="analytics-details">
                                <div>
                                    <span>Successful</span>
                                    <strong>
                                        {summary.successful_requests}
                                    </strong>
                                </div>

                                <div>
                                    <span>Errors</span>
                                    <strong>{summary.error_requests}</strong>
                                </div>

                                <div>
                                    <span>Avg Latency</span>
                                    <strong>
                                        {summary.average_latency_ms.toFixed(1)} ms
                                    </strong>
                                </div>
                            </div>

                            <h3 className="subheading">
                                Status Code Breakdown
                            </h3>

                            <StatusCodeBreakdown
                                breakdown={summary.status_code_breakdown}
                                variant="pills"
                            />
                        </>
                    ) : (
                        <EmptyMessage
                            message={
                                projectId
                                    ? "No analytics data recorded for this project."
                                    : "Select a project to view analytics."
                            }
                        />
                    )}
                </div>

                {/* Assigned API Keys */}
                <div className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Assigned API Keys</h2>
                            <p>
                                API credentials available to you for{" "}
                                {selectedProject?.name ?? "the selected project"}
                            </p>
                        </div>
                    </div>

                    {keys.length > 0 ? (
                        <>
                            <KeyList
                                keys={keys.slice(0, 5)}
                                onSelectForTest={(key) => {
                                    setTestingKey("");
                                    triggerScrollToTester?.();

                                    setNotice(
                                        `Enter the secret for "${key.name}" in the API Test Console.`
                                    );
                                }}
                            />

                            {keys.length > 5 && (
                                <button
                                    className="primary-button compact"
                                    onClick={() =>
                                        navigate("/workspace/api-access")
                                    }
                                >
                                    View all assigned keys →
                                </button>
                            )}
                        </>
                    ) : (
                        <EmptyMessage
                            message="No API keys are assigned to you for this project yet."
                        />
                    )}
                </div>
            </section>

            {/* Interactive Protected API Tester */}
            <ApiTester />
        </>
    );
}

export default OverviewPage;
