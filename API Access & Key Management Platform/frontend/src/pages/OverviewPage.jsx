import { useState } from "react";
import Modal from "../components/Modal/Modal";
import { useWorkspace } from "../hooks/useWorkspace";
import { Activity, KeyRound, FolderKanban, ShieldCheck, Plus } from "lucide-react";
import { Metric } from "../components/Metric";
import { EmptyMessage } from "../components/EmptyMessage";
import { AnalyticsChart } from "../features/analytics/components/AnalyticsChart";
import { StatusCodeBreakdown } from "../features/analytics/components/StatusCodeBreakdown";
import { KeyList } from "../features/apiKeys/components/KeyList";
import { ApiTester } from "../features/apiKeys/components/ApiTester";

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
        revokeKey,
        handleRevokeClick,
        setTestingKey,
        setPage,
        setShowKeyForm,
        triggerScrollToTester,
    } = useWorkspace();

    const [showFullKeyModal, setShowFullKeyModal] = useState(false);

    const chartData = summary
        ? [
            { name: "Successful", requests: summary.successful_requests },
            { name: "Errors", requests: summary.error_requests },
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
                    title="Active API Keys"
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
                        summary ? `${summary.error_rate_percent.toFixed(2)}%` : undefined
                    }
                    icon={<ShieldCheck size={18} />}
                />
            </section>

            <section className="two-column">
                <div className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Request Traffic</h2>
                            <p>Analytics for {selectedProject?.name ?? "selected project"}</p>
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
                                <strong>{summary.total_requests.toLocaleString()}</strong>
                                <span>
                                    total requests over the last {summary.period_days} days
                                </span>
                            </div>

                            <AnalyticsChart
                                data={chartData}
                                gradientId="requestsFill"
                                strokeColor="#7564e8"
                                height={210}
                            />

                            <div className="analytics-details">
                                <div>
                                    <span>Successful</span>
                                    <strong>{summary.successful_requests}</strong>
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

                            <h3 className="subheading">Status Code Breakdown</h3>
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

                <div className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>API Keys</h2>
                            <p>Credentials for {selectedProject?.name ?? "selected project"}</p>
                        </div>
                        <button
                            className="primary-button compact"
                            disabled={!projectId}
                            onClick={() => setShowKeyForm(true)}
                        >
                            <Plus size={15} /> Create
                        </button>
                    </div>

                    <KeyList
                        keys={keys.slice(0, 5)}
                        onRevoke={handleRevokeClick}
                        onSelectForTest={(k) => {
                            setTestingKey(k.key_prefix);
                            triggerScrollToTester?.();
                        }}
                    />

                    {keys.length > 5 && (
                        <button
                            className="primary-button compact"
                            onClick={() => setPage("API Keys")}
                        >
                            View all {keys.length} keys →
                        </button>
                    )}
                </div>
            </section>

            {/* LIVE PROTECTED API TESTER */}
            <ApiTester />
        </>
    );
}

export default OverviewPage;

