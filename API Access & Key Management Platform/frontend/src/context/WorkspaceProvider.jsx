import {
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { WorkspaceContext } from "./WorkspaceContext";
import {
    organizationService,
    projectService,
    apiKeyService,
    analyticsService,
    protectedApiService,
} from "../services";
import { errorMessage } from "../utils/error";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/Modal";

export function WorkspaceProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id;

    const refreshPromiseRef = useRef(null);

    const [page, setPage] = useState("Overview");
    const [organizations, setOrganizations] = useState([]);
    const [organizationId, setOrganizationId] = useState("");
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [keys, setKeys] = useState([]);
    const [summary, setSummary] = useState(null);
    const [days, setDays] = useState(7);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    // Filtering & Search
    const [keyFilter, setKeyFilter] = useState("all");
    const [keySearch, setKeySearch] = useState("");

    // Modals
    const [showOrganizationForm, setShowOrganizationForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [showKeyForm, setShowKeyForm] = useState(false);
    const [showCreatedKey, setShowCreatedKey] = useState(null);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);

    const handleRevokeClick = (key) => {
        setSelectedKey(key);
        setShowRevokeModal(true);
    };

    // Testing Console
    const [testingKey, setTestingKey] = useState("");
    const [testResult, setTestResult] = useState(null);
    const [testLoading, setTestLoading] = useState(false);

    const selectedOrganization = useMemo(
        () => organizations.find((item) => item.id === organizationId),
        [organizations, organizationId]
    );

    const selectedProject = useMemo(
        () => projects.find((item) => item.id === projectId),
        [projects, projectId]
    );

    const activeKeys = useMemo(
        () => keys.filter((key) => !key.revoked_at),
        [keys]
    );

    const revokedKeys = useMemo(
        () => keys.filter((key) => Boolean(key.revoked_at)),
        [keys]
    );

    const filteredKeys = useMemo(() => {
        return keys.filter((key) => {
            if (keyFilter === "active" && key.revoked_at) return false;
            if (keyFilter === "revoked" && !key.revoked_at) return false;
            if (keySearch.trim()) {
                const q = keySearch.toLowerCase();
                return (
                    key.name.toLowerCase().includes(q) ||
                    key.key_prefix.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [keys, keyFilter, keySearch]);

    const loadOrganizations = useCallback(async () => {
        const data = await organizationService.list();
        setOrganizations(data);
        setOrganizationId((current) =>
            data.some((item) => item.id === current) ? current : data[0]?.id ?? ""
        );
        return data;
    }, []);

    const loadProjects = useCallback(async (orgId) => {
        if (!orgId) {
            setProjects([]);
            setProjectId("");
            return [];
        }
        const data = await projectService.list(orgId);
        setProjects(data);
        setProjectId((current) =>
            data.some((item) => item.id === current) ? current : data[0]?.id ?? ""
        );
        return data;
    }, []);

    const loadKeys = useCallback(async (orgId, projId) => {
        if (!orgId || !projId) {
            setKeys([]);
            return [];
        }
        const data = await apiKeyService.list(orgId, projId);
        setKeys(data);
        return data;
    }, []);

    const loadSummary = useCallback(async (orgId, projId, period) => {
        if (!orgId || !projId) {
            setSummary(null);
            return null;
        }
        const data = await analyticsService.summary(orgId, projId, period);
        setSummary(data);
        return data;
    }, []);

    const refreshWorkspace = useCallback(() => {
        if (!userId) return Promise.resolve();

        // Reuse an existing request instead of sending another GET.
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }

        const request = (async () => {
            setLoading(true);
            setError("");

            try {
                const orgs = await organizationService.list();

                setOrganizations(orgs);

                setOrganizationId((current) =>
                    orgs.some((item) => item.id === current)
                        ? current
                        : orgs[0]?.id ?? ""
                );

                setNotice("Workspace refreshed.");
            } catch (e) {
                setError(errorMessage(e));
            } finally {
                setLoading(false);
            }
        })();

        refreshPromiseRef.current = request;

        request.finally(() => {
            if (refreshPromiseRef.current === request) {
                refreshPromiseRef.current = null;
            }
        });

        return request;
    }, [userId]);

    // Handle session expired event
    useEffect(() => {
        const onExpired = () => {
            setOrganizations([]);
            setProjects([]);
            setKeys([]);
            setSummary(null);
            setError("Your session expired. Please sign in again.");
        };

        window.addEventListener("session-expired", onExpired);
        return () => {
            window.removeEventListener("session-expired", onExpired);
        };
    }, []);

    // Initial load when user changes
    useEffect(() => {
        console.log("[DEBUG] Workspace initialization effect", {
            userId,
        });

        if (userId) {
            void refreshWorkspace();
        } else {
            setOrganizations([]);
            setProjects([]);
            setKeys([]);
            setSummary(null);
            setPage("Overview");
        }
    }, [userId, refreshWorkspace]);

    // React to organizationId changes
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

    // React to projectId or days changes
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

    // Actions
    const createOrganization = useCallback(async (data) => {
        setError("");
        setLoading(true);
        try {
            const organization = await organizationService.create(data);
            setOrganizations((items) => [organization, ...items]);
            setOrganizationId(organization.id);
            setProjects([]);
            setProjectId("");
            setShowOrganizationForm(false);
            setNotice(`Organization "${organization.name}" created.`);
            return organization;
        } catch (e) {
            setError(errorMessage(e));
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const createProject = useCallback(async (data) => {
        if (!organizationId) return;
        setError("");
        setLoading(true);
        try {
            const project = await projectService.create(organizationId, data);
            setProjects((items) => [project, ...items]);
            setProjectId(project.id);
            setShowProjectForm(false);
            setPage("Projects");
            setNotice(`Project "${project.name}" created.`);
            return project;
        } catch (e) {
            setError(errorMessage(e));
            throw e;
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    const createKey = useCallback(async (data) => {
        if (!organizationId || !projectId) return;
        setError("");
        setLoading(true);
        try {
            const created = await apiKeyService.create(
                organizationId,
                projectId,
                data
            );
            setKeys((items) => [created, ...items]);
            setShowKeyForm(false);
            setShowCreatedKey(created);
            setNotice(
                "API key created. Save your secret key now; it cannot be retrieved later."
            );
            return created;
        } catch (e) {
            setError(errorMessage(e));
            throw e;
        } finally {
            setLoading(false);
        }
    }, [organizationId, projectId]);

    const revokeKey = useCallback(async (key) => {
        if (!organizationId || !projectId) return;

        setError("");

        try {
            await apiKeyService.revoke(organizationId, projectId, key.id);

            setKeys((items) =>
                items.map((item) =>
                    item.id === key.id
                        ? { ...item, revoked_at: new Date().toISOString() }
                        : item
                )
            );

            setNotice(`API key "${key.name}" revoked.`);
            setShowRevokeModal(false);
            setSelectedKey(null);
        } catch (e) {
            setError(errorMessage(e));
        }
    }, [organizationId, projectId]);

    const testProtectedApi = useCallback(async (keyToTest) => {
        if (!projectId || !keyToTest?.trim()) return;
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await protectedApiService.test(projectId, keyToTest.trim());
            setTestResult(res);
            if (res.ok) {
                setNotice(`API test returned HTTP ${res.status} in ${res.latencyMs}ms.`);
            }
            if (organizationId && projectId) {
                void loadSummary(organizationId, projectId, days);
            }
            return res;
        } catch (e) {
            setError(errorMessage(e));
            throw e;
        } finally {
            setTestLoading(false);
        }
    }, [projectId, organizationId, days, loadSummary]);

    return (
        <WorkspaceContext.Provider
            value={{
                page,
                setPage,
                organizations,
                organizationId,
                setOrganizationId,
                selectedOrganization,
                projects,
                projectId,
                setProjectId,
                selectedProject,
                keys,
                activeKeys,
                revokedKeys,
                filteredKeys,
                summary,
                days,
                setDays,
                loading,
                error,
                setError,
                notice,
                setNotice,
                keyFilter,
                setKeyFilter,
                keySearch,
                setKeySearch,
                showOrganizationForm,
                setShowOrganizationForm,
                showProjectForm,
                setShowProjectForm,
                showKeyForm,
                setShowKeyForm,
                showCreatedKey,
                setShowCreatedKey,
                testingKey,
                setTestingKey,
                testResult,
                setTestResult,
                testLoading,
                loadOrganizations,
                loadProjects,
                loadKeys,
                loadSummary,
                refreshWorkspace,
                createOrganization,
                createProject,
                createKey,
                revokeKey,
                handleRevokeClick,
                testProtectedApi,
            }}
        >
            {children}

            {showRevokeModal && selectedKey && (
                <Modal
                    title="Revoke API Key"
                    onClose={() => {
                        setShowRevokeModal(false);
                        setSelectedKey(null);
                    }}
                >
                    <div className="modal-body">
                        <p>
                            Are you sure you want to revoke API key
                            <strong> "{selectedKey.name}"</strong>?
                        </p>

                        <p className="text-muted">
                            Applications using this key will immediately lose access.
                            This action cannot be undone.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() => {
                                    setShowRevokeModal(false);
                                    setSelectedKey(null);
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="danger-button-main"
                                onClick={() => revokeKey(selectedKey)}
                            >
                                Revoke Key
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </WorkspaceContext.Provider>
    );
}

export default WorkspaceProvider;

