import { useCallback, useEffect, useState } from "react";
import {
  Activity, BarChart3, Check, Copy,
  FolderKanban, KeyRound, LayoutDashboard, LogOut, Plus,
  RefreshCw, ShieldCheck, Terminal, Trash2, Users, X,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  analyticsService, apiKeyService, authService, clearTokens,
  errorMessage, hasSession, /* healthService, */ organizationService,
  projectService, protectedApiService,
  type ApiKey, type CreatedApiKey, type Organization,
  type Project, type TestApiResponse, type UsageSummary, type User,
} from "./api";
import "./App.css";

type Page = "Overview" | "Projects" | "API Keys" | "Analytics" | "Settings";

const navigation = [
  { label: "Overview" as Page, icon: LayoutDashboard },
  { label: "Projects" as Page, icon: FolderKanban },
  { label: "API Keys" as Page, icon: KeyRound },
  { label: "Analytics" as Page, icon: BarChart3 },
  { label: "Settings" as Page, icon: ShieldCheck },
];

function slugify(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateLabel(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(hasSession());
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [page, setPage] = useState<Page>("Overview");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [days, setDays] = useState(7);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Health check status (commented out)
  // const [healthStatus, setHealthStatus] = useState<{
  //   status: "checking" | "healthy" | "degraded" | "offline";
  //   label: string;
  // }>({ status: "checking", label: "Checking backend…" });

  // Filtering & Search
  const [keyFilter, setKeyFilter] = useState<"all" | "active" | "revoked">("all");
  const [keySearch, setKeySearch] = useState("");

  // Modals & forms
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showCreatedKey, setShowCreatedKey] = useState<CreatedApiKey | null>(null);
  const [newOrganizationName, setNewOrganizationName] = useState("");
  const [newOrganizationSlug, setNewOrganizationSlug] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSlug, setNewProjectSlug] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["data:read"]);
  const [expiry, setExpiry] = useState("30");

  // API Testing Console
  const [testingKey, setTestingKey] = useState("");
  const [testResult, setTestResult] = useState<TestApiResponse | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const selectedOrganization = organizations.find((item) => item.id === organizationId);
  const selectedProject = projects.find((item) => item.id === projectId);

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(label);
    setNotice(`Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // const checkHealth = useCallback(async () => {
  //   try {
  //     const base = await healthService.check();
  //     if (base?.status === "healthy") {
  //       try {
  //         const db = await healthService.database();
  //         if (db?.database === "connected") {
  //           setHealthStatus({ status: "healthy", label: "Connected · DB Healthy" });
  //           return;
  //         }
  //       } catch {
  //         setHealthStatus({ status: "degraded", label: "API Online · DB Offline" });
  //         return;
  //       }
  //     }
  //     setHealthStatus({ status: "healthy", label: "FastAPI Online" });
  //   } catch {
  //     setHealthStatus({ status: "offline", label: "FastAPI Offline" });
  //   }
  // }, []);

  const loadOrganizations = useCallback(async () => {
    const data = await organizationService.list();
    setOrganizations(data);
    setOrganizationId((current) =>
      data.some((item) => item.id === current) ? current : data[0]?.id ?? "",
    );
  }, []);

  const loadProjects = useCallback(async (orgId: string) => {
    if (!orgId) {
      setProjects([]);
      setProjectId("");
      return;
    }
    const data = await projectService.list(orgId);
    setProjects(data);
    setProjectId((current) =>
      data.some((item) => item.id === current) ? current : data[0]?.id ?? "",
    );
  }, []);

  const loadKeys = useCallback(async (orgId: string, projId: string) => {
    if (!orgId || !projId) {
      setKeys([]);
      return;
    }
    setKeys(await apiKeyService.list(orgId, projId));
  }, []);

  const loadSummary = useCallback(async (
    orgId: string,
    projId: string,
    period: number,
  ) => {
    if (!orgId || !projId) {
      setSummary(null);
      return;
    }
    setSummary(await analyticsService.summary(orgId, projId, period));
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    // void checkHealth();
    try {
      await loadOrganizations();
      if (organizationId) {
        await loadProjects(organizationId);
        if (projectId) {
          await Promise.all([
            loadKeys(organizationId, projectId),
            loadSummary(organizationId, projectId, days),
          ]);
        }
      }
      setNotice("Workspace refreshed.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user, /* checkHealth, */ loadOrganizations, organizationId, loadProjects, projectId, loadKeys, loadSummary, days]);

  // useEffect(() => {
  //   void checkHealth();
  //   const interval = setInterval(() => void checkHealth(), 30000);
  //   return () => clearInterval(interval);
  // }, [checkHealth]);

  useEffect(() => {
    let alive = true;

    async function restoreSession() {
      if (!hasSession()) {
        setAuthLoading(false);
        return;
      }
      try {
        const currentUser = await authService.me();
        if (alive) setUser(currentUser);
      } catch {
        clearTokens();
        if (alive) setUser(null);
      } finally {
        if (alive) setAuthLoading(false);
      }
    }

    void restoreSession();

    const onExpired = () => {
      setUser(null);
      setOrganizations([]);
      setProjects([]);
      setKeys([]);
      setSummary(null);
      setError("Your session expired. Please sign in again.");
    };

    window.addEventListener("session-expired", onExpired);
    return () => {
      alive = false;
      window.removeEventListener("session-expired", onExpired);
    };
  }, []);

  useEffect(() => {
    if (user) void refreshWorkspace();
  }, [user]);

  useEffect(() => {
    if (!organizationId) {
      setProjects([]);
      setProjectId("");
      return;
    }
    setLoading(true);
    setError("");
    void loadProjects(organizationId)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [organizationId, loadProjects]);

  useEffect(() => {
    if (!organizationId || !projectId) {
      setKeys([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      loadKeys(organizationId, projectId),
      loadSummary(organizationId, projectId, days),
    ])
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [organizationId, projectId, days, loadKeys, loadSummary]);

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (authMode === "register") {
        await authService.register(email, password);
        setNotice("Account created successfully! Please sign in with your credentials.");
        setAuthMode("login");
      } else {
        await authService.login(email, password);
        const currentUser = await authService.me();
        setUser(currentUser);
        setNotice("Signed in successfully.");
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      clearTokens();
    }
    setUser(null);
    setOrganizations([]);
    setProjects([]);
    setKeys([]);
    setSummary(null);
    setPage("Overview");
    setNotice("Signed out.");
  }

  async function createOrganization(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const organization = await organizationService.create({
        name: newOrganizationName.trim(),
        slug: slugify(newOrganizationSlug || newOrganizationName),
      });
      setOrganizations((items) => [organization, ...items]);
      setOrganizationId(organization.id);
      setProjects([]);
      setProjectId("");
      setShowOrganizationForm(false);
      setNewOrganizationName("");
      setNewOrganizationSlug("");
      setNotice(`Organization "${organization.name}" created.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    setError("");
    setLoading(true);
    try {
      const project = await projectService.create(organizationId, {
        name: newProjectName.trim(),
        slug: slugify(newProjectSlug || newProjectName),
      });
      setProjects((items) => [project, ...items]);
      setProjectId(project.id);
      setShowProjectForm(false);
      setNewProjectName("");
      setNewProjectSlug("");
      setPage("Projects");
      setNotice(`Project "${project.name}" created.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function createKey(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !projectId) return;
    setError("");
    setLoading(true);
    try {
      const expiresAt = expiry === "never"
        ? null
        : new Date(Date.now() + Number(expiry) * 86400000).toISOString();

      const created = await apiKeyService.create(organizationId, projectId, {
        name: newKeyName.trim(),
        scopes,
        expires_at: expiresAt,
      });

      setKeys((items) => [created, ...items]);
      setShowKeyForm(false);
      setNewKeyName("");
      setScopes(["data:read"]);
      setExpiry("30");
      setShowCreatedKey(created);
      setNotice("API key created. Save your secret key now; it cannot be retrieved later.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(key: ApiKey) {
    if (!organizationId || !projectId) return;
    if (!window.confirm(`Revoke API key "${key.name}"? Applications using this key will immediately lose access.`)) return;
    setError("");
    try {
      await apiKeyService.revoke(organizationId, projectId, key.id);
      setKeys((items) => items.map((item) =>
        item.id === key.id ? { ...item, revoked_at: new Date().toISOString() } : item,
      ));
      setNotice(`API key "${key.name}" revoked.`);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function testProtectedApi(event: React.FormEvent) {
    event.preventDefault();
    if (!projectId || !testingKey.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await protectedApiService.test(projectId, testingKey.trim());
      setTestResult(res);
      if (res.ok) {
        setNotice(`API test returned HTTP ${res.status} in ${res.latencyMs}ms.`);
      }
      // Re-fetch usage analytics to reflect the newly logged request
      if (organizationId && projectId) {
        void loadSummary(organizationId, projectId, days);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setTestLoading(false);
    }
  }

  function toggleScope(scope: string) {
    setScopes((items) => items.includes(scope)
      ? items.filter((item) => item !== scope)
      : [...items, scope],
    );
  }

  if (authLoading) {
    return (
      <div className="screen-center">
        <RefreshCw size={24} className="spin" />
        <p>Restoring your session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={submitAuth}>
          <div className="brand-mark"><KeyRound size={24} /></div>
          <p className="auth-kicker">KEYFLOW PLATFORM</p>
          <h1>{authMode === "login" ? "Welcome back" : "Create developer account"}</h1>
          <p className="auth-subtitle">
            {authMode === "login"
              ? "Sign in to manage your organizations, API keys, and monitor usage."
              : "Register to start provisioning API keys with fine-grained scopes."}
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          {notice && <div className="alert alert-success">{notice}</div>}
          <label>Email address</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@example.com"
          />
          <label>Password</label>
          <input
            type="password"
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 12 characters"
          />
          <button className="primary-button full-width" disabled={loading}>
            {loading ? "Authenticating…" : authMode === "login" ? "Sign in" : "Create account"}
          </button>
          <p className="auth-switch">
            {authMode === "login" ? "New to the platform?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
                setNotice("");
              }}
            >
              {authMode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          {authMode === "register" && (
            <p className="auth-footnote">
              Password must contain at least 12 characters for secure credential hashing.
            </p>
          )}
        </form>
      </div>
    );
  }

  const activeKeys = keys.filter((key) => !key.revoked_at);
  const revokedKeys = keys.filter((key) => Boolean(key.revoked_at));

  const filteredKeys = keys.filter((key) => {
    if (keyFilter === "active" && key.revoked_at) return false;
    if (keyFilter === "revoked" && !key.revoked_at) return false;
    if (keySearch.trim()) {
      const q = keySearch.toLowerCase();
      return key.name.toLowerCase().includes(q) || key.key_prefix.toLowerCase().includes(q);
    }
    return true;
  });

  const chartData = summary
    ? [
      { name: "Successful", requests: summary.successful_requests },
      { name: "Errors", requests: summary.error_requests },
    ]
    : [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><KeyRound size={22} /></div>
          <div><strong>Keyflow</strong><small>API ACCESS PLATFORM</small></div>
        </div>

        <div className="side-label">ORGANIZATION</div>
        <select
          className="workspace-select"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          aria-label="Select organization"
        >
          <option value="">Select organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name} · {org.role}</option>
          ))}
        </select>
        <button className="side-create" onClick={() => setShowOrganizationForm(true)}>
          <Plus size={16} /> New organization
        </button>

        <div className="side-label">NAVIGATION</div>
        <nav className="side-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={page === label ? "side-link selected" : "side-link"}
              onClick={() => setPage(label)}
            >
              <Icon size={18} /><span>{label}</span>
              {label === "API Keys" && activeKeys.length > 0 && (
                <span className="nav-count">{activeKeys.length}</span>
              )}
              {label === "Projects" && projects.length > 0 && (
                <span className="nav-count">{projects.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="signed-user">
            <div className="avatar">{user.email.slice(0, 1).toUpperCase()}</div>
            <div className="signed-user-info">
              <strong>{user.email}</strong>
              <small>{selectedOrganization?.role ?? "Developer"}</small>
            </div>
          </div>
          <button className="side-link logout-link" onClick={() => void logout()}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Platform <span>/</span> <strong>{page}</strong></div>
          <div className="topbar-right">
            {/* Health check indicator commented out */}
            {/* <span
              className={`online-pill ${healthStatus.status}`}
              title="Click to check backend and database health"
              onClick={() => void checkHealth()}
              style={{ cursor: "pointer" }}
            >
              <i /> {healthStatus.label}
            </span> */}
            <span className="online-pill healthy">
              <i /> API Workspace
            </span>
            <button className="icon-button" title="Refresh data" onClick={() => void refreshWorkspace()}>
              <RefreshCw size={17} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button>
            </div>
          )}
          {notice && (
            <div className="alert alert-success">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={16} /></button>
            </div>
          )}

          <section className="welcome-section">
            <div>
              <p className="eyebrow">API ACCESS & KEY MANAGEMENT</p>
              <h1>{page === "Overview" ? "Workspace Overview" : page}</h1>
              <p className="page-subtitle">
                Securely generate, scope, revoke, and monitor API keys backed by FastAPI & PostgreSQL.
              </p>
            </div>
            <div className="header-actions">
              <button className="secondary-button" onClick={() => setShowOrganizationForm(true)}>
                <Plus size={16} /> Organization
              </button>
              <button
                className="primary-button"
                disabled={!organizationId}
                onClick={() => setShowProjectForm(true)}
              >
                <Plus size={17} /> New Project
              </button>
            </div>
          </section>

          <section className="selection-bar">
            <div>
              <label>Current Organization</label>
              <strong>{selectedOrganization?.name ?? "No organization selected"}</strong>
            </div>
            <div>
              <label>Current Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!organizationId || projects.length === 0}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} ({project.slug})</option>
                ))}
              </select>
            </div>
            <div className="selection-role">
              <ShieldCheck size={17} />
              Role: {selectedOrganization?.role ?? "None"}
            </div>
          </section>

          {!organizations.length && (
            <section className="empty-workspace panel">
              <div className="empty-icon"><Users size={24} /></div>
              <h2>Create your first organization</h2>
              <p>
                Organizations represent your company or workspace. They hold your projects, team memberships, and API keys.
              </p>
              <button className="primary-button" onClick={() => setShowOrganizationForm(true)}>
                <Plus size={16} /> Create Organization
              </button>
            </section>
          )}

          {organizations.length > 0 && !projects.length && (
            <section className="empty-workspace panel">
              <div className="empty-icon"><FolderKanban size={24} /></div>
              <h2>Create your first project</h2>
              <p>
                Projects compartmentalize your applications. Each project gets its own isolated set of API keys and request logs.
              </p>
              <button
                className="primary-button"
                disabled={!organizationId}
                onClick={() => setShowProjectForm(true)}
              >
                <Plus size={16} /> Create Project
              </button>
            </section>
          )}

          {/* OVERVIEW PAGE */}
          {page === "Overview" && (
            <>
              <section className="metrics-grid">
                <Metric title="Total Requests" value={summary?.total_requests} icon={<Activity size={18} />} />
                <Metric title="Active API Keys" value={activeKeys.length} icon={<KeyRound size={18} />} />
                <Metric title="Projects" value={projects.length} icon={<FolderKanban size={18} />} />
                <Metric
                  title="Error Rate"
                  value={summary ? `${summary.error_rate_percent.toFixed(2)}%` : undefined}
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
                    <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                      <option value={7}>Last 7 days</option>
                      <option value={14}>Last 14 days</option>
                      <option value={30}>Last 30 days</option>
                    </select>
                  </div>
                  {summary ? (
                    <>
                      <div className="analytics-highlight">
                        <strong>{summary.total_requests.toLocaleString()}</strong>
                        <span>total requests over the last {summary.period_days} days</span>
                      </div>
                      <div className="chart-wrap">
                        <ResponsiveContainer width="100%" height={210}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7564e8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#7564e8" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef5" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="requests"
                              stroke="#7564e8"
                              fill="url(#requestsFill)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="analytics-details">
                        <div><span>Successful</span><strong>{summary.successful_requests}</strong></div>
                        <div><span>Errors</span><strong>{summary.error_requests}</strong></div>
                        <div><span>Avg Latency</span><strong>{summary.average_latency_ms.toFixed(1)} ms</strong></div>
                      </div>
                      <h3 className="subheading">Status Code Breakdown</h3>
                      <div className="status-breakdown">
                        {Object.entries(summary.status_code_breakdown).map(([code, count]) => (
                          <div key={code}><span>HTTP {code}</span><strong>{count}</strong></div>
                        ))}
                        {!Object.keys(summary.status_code_breakdown).length && <p>No API calls recorded in this time window.</p>}
                      </div>
                    </>
                  ) : (
                    <EmptyMessage message={projectId ? "No analytics data recorded for this project." : "Select a project to view analytics."} />
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
                  <KeyList keys={keys.slice(0, 5)} onRevoke={revokeKey} onSelectForTest={(k) => setTestingKey(k.key_prefix)} />
                  {keys.length > 5 && (
                    <button className="text-button" onClick={() => setPage("API Keys")}>
                      View all {keys.length} keys →
                    </button>
                  )}
                </div>
              </section>

              {/* LIVE PROTECTED API TESTER */}
              <section className="panel protected-test">
                <div className="panel-heading">
                  <div>
                    <h2>Interactive API Test Console</h2>
                    <p>Send authenticated requests to your protected endpoint via FastAPI & Prisma middleware.</p>
                  </div>
                  <span className="method-badge">GET</span>
                </div>
                <code className="endpoint-code">
                  /v1/projects/{projectId || "{project_id}"}/data
                </code>
                <form className="inline-form" onSubmit={testProtectedApi}>
                  <input
                    value={testingKey}
                    onChange={(e) => setTestingKey(e.target.value)}
                    placeholder="Enter or paste API key (e.g. ak_live_...)"
                    required
                  />
                  <button className="primary-button" disabled={!projectId || testLoading}>
                    {testLoading ? "Sending…" : "Send Test Request"}
                  </button>
                </form>

                {testResult && (
                  <div className="test-console">
                    <div className="test-console-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`status-badge ${testResult.status < 300 ? "status-2xx" : testResult.status < 500 ? "status-4xx" : "status-5xx"}`}>
                          HTTP {testResult.status} {testResult.statusText}
                        </span>
                        <span className="latency-badge">{testResult.latencyMs}ms</span>
                      </div>
                      <button
                        className="copy-snippet-btn"
                        onClick={() => copyToClipboard(JSON.stringify(testResult.data, null, 2), "Response JSON")}
                      >
                        <Copy size={12} /> {copiedText === "Response JSON" ? "Copied" : "Copy JSON"}
                      </button>
                    </div>
                    <pre className="result-box">{JSON.stringify(testResult.data, null, 2)}</pre>
                  </div>
                )}
              </section>
            </>
          )}

          {/* PROJECTS PAGE */}
          {page === "Projects" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Projects</h2>
                  <p>Projects configured in {selectedOrganization?.name ?? "your organization"}</p>
                </div>
                <button className="primary-button compact" disabled={!organizationId} onClick={() => setShowProjectForm(true)}>
                  <Plus size={15} /> New Project
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Slug</th>
                      <th>Project ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <strong>{project.name}</strong>
                        </td>
                        <td><code>{project.slug}</code></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <code>{project.id}</code>
                            <button
                              className="icon-button"
                              style={{ width: 24, height: 24 }}
                              title="Copy Project ID"
                              onClick={() => copyToClipboard(project.id, "Project ID")}
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </td>
                        <td>
                          {project.id === projectId ? (
                            <span className="badge badge-current">Active Project</span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="secondary-button compact"
                              onClick={() => {
                                setProjectId(project.id);
                                setPage("Overview");
                              }}
                            >
                              Select & Open
                            </button>
                            <button
                              className="secondary-button compact"
                              onClick={() => {
                                setProjectId(project.id);
                                setPage("API Keys");
                              }}
                            >
                              Keys
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!projects.length && <EmptyMessage message="No projects in this organization yet. Create one to begin managing API keys." />}
            </section>
          )}

          {/* API KEYS PAGE */}
          {page === "API Keys" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>API Keys Management</h2>
                  <p>Secrets are stored as cryptographic SHA-256 hashes. Plaintext keys are never preserved on the backend.</p>
                </div>
                <button className="primary-button compact" disabled={!projectId} onClick={() => setShowKeyForm(true)}>
                  <Plus size={15} /> Create API Key
                </button>
              </div>

              <div className="filter-bar">
                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${keyFilter === "all" ? "active" : ""}`}
                    onClick={() => setKeyFilter("all")}
                  >
                    All ({keys.length})
                  </button>
                  <button
                    className={`filter-tab ${keyFilter === "active" ? "active" : ""}`}
                    onClick={() => setKeyFilter("active")}
                  >
                    Active ({activeKeys.length})
                  </button>
                  <button
                    className={`filter-tab ${keyFilter === "revoked" ? "active" : ""}`}
                    onClick={() => setKeyFilter("revoked")}
                  >
                    Revoked ({revokedKeys.length})
                  </button>
                </div>

                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search by key name or prefix…"
                    value={keySearch}
                    onChange={(e) => setKeySearch(e.target.value)}
                  />
                </div>
              </div>

              <KeyList
                keys={filteredKeys}
                onRevoke={revokeKey}
                detailed
                onSelectForTest={(key) => {
                  setTestingKey(key.key_prefix);
                  setPage("Overview");
                  setNotice(`Loaded key prefix "${key.key_prefix}" into tester.`);
                }}
              />
            </section>
          )}

          {/* ANALYTICS PAGE */}
          {page === "Analytics" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Usage Analytics & Monitoring</h2>
                  <p>Aggregated telemetry for project: {selectedProject?.name ?? "None selected"}</p>
                </div>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
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
                      <strong style={{ fontSize: 20 }}>{summary.total_requests}</strong>
                    </div>
                    <div>
                      <span>Successful Requests</span>
                      <strong style={{ fontSize: 20, color: "#10b981" }}>{summary.successful_requests}</strong>
                    </div>
                    <div>
                      <span>Error Requests</span>
                      <strong style={{ fontSize: 20, color: summary.error_requests > 0 ? "#ef4444" : "#64748b" }}>
                        {summary.error_requests}
                      </strong>
                    </div>
                    <div>
                      <span>Error Rate</span>
                      <strong style={{ fontSize: 20 }}>{summary.error_rate_percent.toFixed(2)}%</strong>
                    </div>
                    <div>
                      <span>Average Latency</span>
                      <strong style={{ fontSize: 20 }}>{summary.average_latency_ms.toFixed(1)} ms</strong>
                    </div>
                    <div>
                      <span>Monitored Window</span>
                      <strong style={{ fontSize: 20 }}>{summary.period_days} days</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <h3 className="subheading">Request Volume Over Period</h3>
                    <div className="chart-wrap" style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="requests"
                            stroke="#4f46e5"
                            fill="url(#analyticsFill)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <h3 className="subheading">HTTP Status Codes Breakdown</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                      {Object.entries(summary.status_code_breakdown).map(([code, count]) => {
                        const pct = summary.total_requests > 0 ? ((count / summary.total_requests) * 100).toFixed(1) : "0";
                        const is2xx = code.startsWith("2");
                        const is4xx = code.startsWith("4");
                        return (
                          <div className="breakdown-card" key={code}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 700, color: is2xx ? "#059669" : is4xx ? "#d97706" : "#dc2626" }}>
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
                                  backgroundColor: is2xx ? "#10b981" : is4xx ? "#f59e0b" : "#ef4444",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {!Object.keys(summary.status_code_breakdown).length && (
                        <p style={{ color: "#94a3b8", fontSize: 12 }}>No request logs recorded in this period.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyMessage message="Select a project to load usage telemetry and request breakdown." />
              )}
            </section>
          )}

          {/* SETTINGS PAGE */}
          {page === "Settings" && (
            <div className="settings-grid">
              <section className="settings-card">
                <h3><ShieldCheck size={18} /> User Account & Authentication</h3>
                <div className="settings-row">
                  <span>Email address</span>
                  <strong>{user.email}</strong>
                </div>
                <div className="settings-row">
                  <span>User ID</span>
                  <code>{user.id}</code>
                </div>
                <div className="settings-row">
                  <span>Session Security</span>
                  <strong>JWT Access Token with Automatic Refresh Rotation</strong>
                </div>
              </section>

              <section className="settings-card">
                <h3><Users size={18} /> Organization & Role</h3>
                <div className="settings-row">
                  <span>Organization Name</span>
                  <strong>{selectedOrganization?.name ?? "None"}</strong>
                </div>
                <div className="settings-row">
                  <span>Slug</span>
                  <code>{selectedOrganization?.slug ?? "None"}</code>
                </div>
                <div className="settings-row">
                  <span>Assigned Role</span>
                  <strong>{selectedOrganization?.role ?? "None"}</strong>
                </div>
              </section>

              <section className="settings-card">
                <h3><Terminal size={18} /> Developer API Cheatsheet & Integration</h3>
                <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 10px" }}>
                  Integrate your client or server with the protected endpoint using any HTTP client:
                </p>
                <div className="code-snippet-box">
                  <code>
                    curl -X GET "http://127.0.0.1:8000/v1/projects/{projectId || "&lt;project_id&gt;"}/data" \<br />
                    &nbsp;&nbsp;-H "X-API-Key: ak_live_your_api_key_secret"
                  </code>
                  <button
                    className="copy-snippet-btn"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X GET "http://127.0.0.1:8000/v1/projects/${projectId || "<project_id>"}/data" -H "X-API-Key: ak_live_your_api_key_secret"`,
                        "cURL snippet",
                      )
                    }
                  >
                    <Copy size={12} /> {copiedText === "cURL snippet" ? "Copied" : "Copy cURL"}
                  </button>
                </div>
              </section>

              <section className="settings-card">
                <h3><RefreshCw size={18} /> Workspace Actions</h3>
                <div className="action-row">
                  <button className="secondary-button" onClick={() => void refreshWorkspace()}>
                    <RefreshCw size={15} /> Refresh Workspace
                  </button>
                  <button className="secondary-button" onClick={() => void logout()}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </section>
            </div>
          )}

          {loading && <div className="loading-indicator">Updating…</div>}

          <footer className="footer">
            <span>Keyflow Platform · API Access & Key Management</span>
            <span>Connected to FastAPI (Port 8000) & PostgreSQL</span>
          </footer>
        </div>
      </main>

      {/* MODAL: CREATE ORGANIZATION */}
      {showOrganizationForm && (
        <Modal title="Create Organization" onClose={() => setShowOrganizationForm(false)}>
          <form onSubmit={createOrganization} className="modal-form">
            <label>Organization Name</label>
            <input
              required
              minLength={2}
              maxLength={100}
              value={newOrganizationName}
              onChange={(e) => {
                setNewOrganizationName(e.target.value);
                if (!newOrganizationSlug) setNewOrganizationSlug(slugify(e.target.value));
              }}
              placeholder="Acme Engineering"
            />
            <label>Organization URL Slug</label>
            <input
              required
              minLength={2}
              maxLength={50}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={newOrganizationSlug}
              onChange={(e) => setNewOrganizationSlug(e.target.value)}
              placeholder="acme-engineering"
            />
            <p className="field-help">Lowercase alphanumeric characters and single hyphens only.</p>
            <button className="primary-button full-width" disabled={loading}>
              Create Organization
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE PROJECT */}
      {showProjectForm && (
        <Modal title="Create Project" onClose={() => setShowProjectForm(false)}>
          <form onSubmit={createProject} className="modal-form">
            <label>Project Name</label>
            <input
              required
              minLength={2}
              maxLength={100}
              value={newProjectName}
              onChange={(e) => {
                setNewProjectName(e.target.value);
                if (!newProjectSlug) setNewProjectSlug(slugify(e.target.value));
              }}
              placeholder="Mobile Backend API"
            />
            <label>Project Slug</label>
            <input
              required
              minLength={2}
              maxLength={50}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={newProjectSlug}
              onChange={(e) => setNewProjectSlug(e.target.value)}
              placeholder="mobile-backend-api"
            />
            <p className="field-help">Belongs to organization: <strong>{selectedOrganization?.name}</strong></p>
            <button className="primary-button full-width" disabled={loading || !organizationId}>
              Create Project
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE API KEY */}
      {showKeyForm && (
        <Modal title="Create New API Key" onClose={() => setShowKeyForm(false)}>
          <form onSubmit={createKey} className="modal-form">
            <label>API Key Name</label>
            <input
              required
              minLength={2}
              maxLength={100}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Ingestion Worker"
            />

            <label>Permissions & Scopes</label>
            {[
              { id: "data:read", label: "data:read", desc: "Read project data and protected resources" },
              { id: "data:write", label: "data:write", desc: "Write or update project datasets" },
              { id: "usage:read", label: "usage:read", desc: "Read key usage metrics and rate limits" },
            ].map((scope) => (
              <label className="scope-option" key={scope.id}>
                <input
                  type="checkbox"
                  checked={scopes.includes(scope.id)}
                  onChange={() => toggleScope(scope.id)}
                />
                <span>
                  <strong>{scope.label}</strong>
                  <small>{scope.desc}</small>
                </span>
              </label>
            ))}

            <label>Expiration Preset</label>
            <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              <option value="7">7 days</option>
              <option value="30">30 days (Recommended)</option>
              <option value="90">90 days</option>
              <option value="never">No Expiration</option>
            </select>

            {scopes.length === 0 && <p className="field-error">Please select at least one permission scope.</p>}
            <button className="primary-button full-width" disabled={loading || !scopes.length || !projectId}>
              Generate API Key
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATED API KEY COPY */}
      {showCreatedKey && (
        <Modal title="API Key Generated Successfully" onClose={() => setShowCreatedKey(null)}>
          <div className="alert alert-warning">
            This secret key is only displayed once. Please copy and store it safely in your environment variables.
          </div>
          <p className="created-key-name"><strong>Name:</strong> {showCreatedKey.name}</p>
          <div className="secret-box">
            <code>{showCreatedKey.api_key}</code>
            <button
              className="secondary-button compact"
              onClick={() => copyToClipboard(showCreatedKey.api_key, "Secret Key")}
            >
              <Copy size={15} /> Copy
            </button>
          </div>
          <p className="field-help">Scopes: {showCreatedKey.scopes.join(", ")}</p>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              className="secondary-button"
              style={{ flex: 1 }}
              onClick={() => {
                setTestingKey(showCreatedKey.api_key);
                setShowCreatedKey(null);
                setPage("Overview");
                setNotice("API key loaded into Interactive Test Console.");
              }}
            >
              <Terminal size={15} /> Test Key Now
            </button>
            <button
              className="primary-button"
              style={{ flex: 1 }}
              onClick={() => setShowCreatedKey(null)}
            >
              <Check size={16} /> Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ title, value, icon }: {
  title: string;
  value: number | string | undefined;
  icon: React.ReactNode;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span>{title}</span><span className="metric-icon">{icon}</span></div>
      <div className="metric-value">{value === undefined ? "—" : value}</div>
      <div className="metric-note">{value === undefined ? "Select a project" : "Live telemetry"}</div>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return <div className="empty-message"><FolderKanban size={24} /><p>{message}</p></div>;
}

function KeyList({
  keys,
  onRevoke,
  detailed = false,
  onSelectForTest,
}: {
  keys: ApiKey[];
  onRevoke: (key: ApiKey) => void;
  detailed?: boolean;
  onSelectForTest?: (key: ApiKey) => void;
}) {
  if (!keys.length) return <EmptyMessage message="No API keys match your criteria." />;

  return (
    <div className="key-list">
      {keys.map((key) => (
        <div className="key-row" key={key.id}>
          <div className="key-icon"><KeyRound size={18} /></div>
          <div className="key-info">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong>{key.name}</strong>
              <span className={`state ${key.revoked_at ? "revoked" : "active"}`}>
                {key.revoked_at ? "Revoked" : "Active"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <code>{key.key_prefix}••••••••</code>
              <button
                className="icon-button"
                style={{ width: 22, height: 22 }}
                title="Copy Prefix"
                onClick={() => {
                  void navigator.clipboard.writeText(key.key_prefix);
                }}
              >
                <Copy size={11} />
              </button>
            </div>
            <div>
              {key.scopes.map((s) => (
                <span key={s} className="scope-chip">{s}</span>
              ))}
            </div>
            {detailed && (
              <small style={{ color: "#94a3b8" }}>
                Created: {dateLabel(key.created_at)} · Expires: {dateLabel(key.expires_at)} · Last used: {dateLabel(key.last_used_at)}
              </small>
            )}
          </div>
          <div className="key-actions">
            {onSelectForTest && !key.revoked_at && (
              <button
                className="secondary-button compact"
                title="Use in API Tester"
                onClick={() => onSelectForTest(key)}
              >
                Test
              </button>
            )}
            {!key.revoked_at && (
              <button
                className="icon-button danger-button"
                title="Revoke API key"
                onClick={() => onRevoke(key)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default App;
