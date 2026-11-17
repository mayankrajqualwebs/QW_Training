import { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { useClipboard } from "../../../hooks/useClipboard";

export function ApiTester() {
    const {
        projectId,
        testingKey,
        setTestingKey,
        testResult,
        testLoading,
        testProtectedApi,
        setNotice,
        shouldScrollToTester,
        consumeScrollToTester,
    } = useWorkspace();
    const { copiedText, copyToClipboard } = useClipboard();
    const testerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!shouldScrollToTester) return;

        let cancelled = false;
        const scrollToTarget = () => {
            const target = testerRef.current || document.querySelector(".panel.protected-test");
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                inputRef.current?.focus();
                consumeScrollToTester?.();
            } else if (!cancelled) {
                requestAnimationFrame(scrollToTarget);
            }
        };

        const timer = setTimeout(() => {
            if (!cancelled) {
                scrollToTarget();
            }
        }, 100);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [shouldScrollToTester, consumeScrollToTester]);

    async function handleTest(event) {
        event.preventDefault();
        await testProtectedApi(testingKey);
    }

    return (
        <section ref={testerRef} id="protected-test" className="panel protected-test">
            <div className="panel-heading">
                <div>
                    <h2>Interactive API Test Console</h2>
                    <p>
                        Send authenticated requests to your protected endpoint via FastAPI & Prisma middleware.
                    </p>
                </div>
                <span className="method-badge">GET</span>
            </div>
            <code className="endpoint-code">
                /v1/projects/{projectId || "{project_id}"}/data
            </code>
            <form className="inline-form" onSubmit={handleTest}>
                <input
                    ref={inputRef}
                    value={testingKey}
                    onChange={(e) => setTestingKey(e.target.value)}
                    placeholder="Enter or paste API Key ID or secret..."
                    required
                />
                <button
                    className="primary-button"
                    disabled={!projectId || testLoading}
                >
                    {testLoading ? "Sending…" : "Send Test Request"}
                </button>
            </form>

            {testResult && (
                <div className="test-console">
                    <div className="test-console-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                                className={`status-badge ${
                                    testResult.data?.success === false
                                        ? "status-4xx"
                                        : testResult.status < 300
                                        ? "status-2xx"
                                        : "status-4xx"
                                }`}
                            >
                                {testResult.data?.status
                                    ? `STATUS: ${testResult.data.status.toUpperCase()}`
                                    : `HTTP ${testResult.status} ${testResult.statusText}`}
                            </span>
                            <span className="latency-badge">{testResult.latencyMs}ms</span>
                        </div>
                        <button
                            className="copy-snippet-btn"
                            onClick={() =>
                                copyToClipboard(
                                    JSON.stringify(testResult.data, null, 2),
                                    "Response JSON",
                                    setNotice
                                )
                            }
                        >
                            <Copy size={12} />{" "}
                            {copiedText === "Response JSON" ? "Copied" : "Copy JSON"}
                        </button>
                    </div>
                    <pre className="result-box">
                        {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                </div>
            )}
        </section>
    );
}

export default ApiTester;

