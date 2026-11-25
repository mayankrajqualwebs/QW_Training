
import { useCallback, useEffect, useState } from "react";

import {
    FileText,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { Alert } from "../components/Alert";
import { EmptyMessage } from "../components/EmptyMessage";
import { adminService } from "../services/adminService";

const PAGE_SIZE = 20;

function formatFileSize(bytes) {
    if (bytes == null || bytes === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString();
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [projects, setProjects] = useState([]);

    const [search, setSearch] = useState("");
    const [organizationId, setOrganizationId] = useState("");
    const [projectId, setProjectId] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const totalPages = Math.max(
        1,
        Math.ceil(total / PAGE_SIZE)
    );

    // -------------------------------------------------------------
    // Load Documents
    // -------------------------------------------------------------

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await adminService.getDocuments({
                search: search.trim() || undefined,
                organization_id: organizationId || undefined,
                project_id: projectId || undefined,
                page,
                page_size: PAGE_SIZE,
            });

            setDocuments(data.documents ?? []);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Failed to load documents."
            );
        } finally {
            setLoading(false);
        }
    }, [search, organizationId, projectId, page]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    // -------------------------------------------------------------
    // Load Organizations
    // -------------------------------------------------------------

    const loadOrganizations = useCallback(async () => {
        try {
            const data = await adminService.getOrganizations();
            setOrganizations(data ?? []);
        } catch (err) {
            console.error(
                "Failed to load organizations:",
                err
            );
        }
    }, []);

    useEffect(() => {
        loadOrganizations();
    }, [loadOrganizations]);

    // -------------------------------------------------------------
    // Load Projects
    // -------------------------------------------------------------

    const loadProjects = useCallback(async () => {
        try {
            const data = await adminService.getProjects({
                organization_id: organizationId || undefined,
                page: 1,
                page_size: 100,
            });

            setProjects(data.projects ?? []);
        } catch (err) {
            console.error(
                "Failed to load projects:",
                err
            );
        }
    }, [organizationId]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // -------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };

    const handleOrganizationChange = (value) => {
        setOrganizationId(value);
        setProjectId("");
        setPage(1);
    };

    const handleProjectChange = (value) => {
        setProjectId(value);
        setPage(1);
    };

    // -------------------------------------------------------------
    // UI
    // -------------------------------------------------------------

    return (
        <div className="admin-documents">
            <div className="admin-documents-header">
                <div>
                    <h1>Documents Management</h1>
                    <p>
                        View documents stored across the platform.
                    </p>
                </div>

                <button
                    className="btn-secondary"
                    onClick={loadDocuments}
                    disabled={loading}
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {error && (
                <Alert
                    type="error"
                    message={error}
                />
            )}

            <div className="admin-documents-toolbar">
                <div className="admin-documents-search">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={search}
                        onChange={(event) =>
                            handleSearchChange(event.target.value)
                        }
                    />
                </div>

                <select
                    className="admin-documents-filter"
                    value={organizationId}
                    onChange={(event) =>
                        handleOrganizationChange(event.target.value)
                    }
                >
                    <option value="">All Organizations</option>

                    {organizations.map((organization) => (
                        <option
                            key={organization.id}
                            value={organization.id}
                        >
                            {organization.name}
                        </option>
                    ))}
                </select>

                <select
                    className="admin-documents-filter"
                    value={projectId}
                    onChange={(event) =>
                        handleProjectChange(event.target.value)
                    }
                >
                    <option value="">All Projects</option>

                    {projects.map((project) => (
                        <option
                            key={project.id}
                            value={project.id}
                        >
                            {project.name}
                        </option>
                    ))}
                </select>

                <div className="admin-documents-count">
                    <FileText size={17} />
                    <span>{total} documents</span>
                </div>
            </div>

            <div className="admin-documents-table-card">
                <div className="admin-documents-table-wrapper">
                    <table className="admin-documents-table">
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Organization</th>
                                <th>Project</th>
                                <th>Size</th>
                                <th>Status</th>
                                <th>Version</th>
                                <th>Uploaded</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="admin-documents-loading">
                                            Loading documents...
                                        </div>
                                    </td>
                                </tr>
                            ) : documents.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyMessage
                                            icon={FileText}
                                            title="No documents found"
                                            description={
                                                search ||
                                                    organizationId ||
                                                    projectId
                                                    ? "Try changing your search or filters."
                                                    : "There are no documents on the platform yet."
                                            }
                                        />
                                    </td>
                                </tr>
                            ) : (
                                documents.map((document) => (
                                    <tr key={document.id}>
                                        <td>
                                            <div className="admin-document-name">
                                                <div className="admin-document-icon">
                                                    <FileText size={17} />
                                                </div>

                                                <div>
                                                    <span className="admin-document-title">
                                                        {document.name}
                                                    </span>

                                                    <span className="admin-document-original">
                                                        {document.original_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {document.organization_name}
                                        </td>

                                        <td>
                                            {document.project_name}
                                        </td>

                                        <td>
                                            {formatFileSize(document.size)}
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-document-status status-${String(
                                                    document.status
                                                ).toLowerCase()}`}
                                            >
                                                {document.status}
                                            </span>
                                        </td>

                                        <td>
                                            v{document.current_version}
                                        </td>

                                        <td>
                                            {formatDate(document.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="admin-documents-pagination">
                    <span>
                        {total === 0
                            ? "Showing 0 documents"
                            : `Showing ${(page - 1) * PAGE_SIZE + 1
                            }–${Math.min(
                                page * PAGE_SIZE,
                                total
                            )} of ${total}`}
                    </span>

                    <div className="admin-documents-pagination-actions">
                        <button
                            className="btn-secondary"
                            disabled={page <= 1 || loading}
                            onClick={() =>
                                setPage((current) => current - 1)
                            }
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="admin-documents-page-number">
                            {page} / {totalPages}
                        </span>

                        <button
                            className="btn-secondary"
                            disabled={page >= totalPages || loading}
                            onClick={() =>
                                setPage((current) => current + 1)
                            }
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
