
import { useCallback, useEffect, useState } from "react";
import {
    FolderKanban,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { Alert } from "../components/Alert";
import { EmptyMessage } from "../components/EmptyMessage";
import { adminService } from "../services/adminService";

const PAGE_SIZE = 20;

export default function AdminProjectsPage() {
    // -------------------------------------------------------------
    // State
    // -------------------------------------------------------------

    const [projects, setProjects] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    const [search, setSearch] = useState("");
    const [organizationId, setOrganizationId] = useState("");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const totalPages = Math.max(
        1,
        Math.ceil(total / PAGE_SIZE)
    );

    // -------------------------------------------------------------
    // Load Projects
    // -------------------------------------------------------------

    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await adminService.getProjects({
                search: search.trim() || undefined,
                organization_id: organizationId || undefined,
                page,
                page_size: PAGE_SIZE,
            });

            setProjects(data.projects ?? []);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Failed to load projects."
            );
        } finally {
            setLoading(false);
        }
    }, [search, organizationId, page]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

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
    // Search Handler
    // -------------------------------------------------------------

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };

    // -------------------------------------------------------------
    // Organization Filter Handler
    // -------------------------------------------------------------

    const handleOrganizationChange = (value) => {
        setOrganizationId(value);
        setPage(1);
    };

    // -------------------------------------------------------------
    // Render
    // -------------------------------------------------------------

    return (
        <div className="admin-projects">
            {/* Header */}
            <div className="admin-projects-header">
                <button
                    className="btn-secondary"
                    onClick={loadProjects}
                    disabled={loading}
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <Alert
                    type="error"
                    message={error}
                />
            )}

            {/* Search and Filters */}
            <div className="admin-projects-toolbar">
                {/* Search */}
                <div className="admin-projects-search">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(event) =>
                            handleSearchChange(event.target.value)
                        }
                    />
                </div>

                {/* Organization Filter */}
                <select
                    className="admin-projects-organization-filter"
                    value={organizationId}
                    onChange={(event) =>
                        handleOrganizationChange(event.target.value)
                    }
                >
                    <option value="">
                        All Organizations
                    </option>

                    {organizations.map((organization) => (
                        <option
                            key={organization.id}
                            value={organization.id}
                        >
                            {organization.name}
                        </option>
                    ))}
                </select>

                {/* Project Count */}
                <div className="admin-projects-count">
                    <FolderKanban size={17} />
                    <span>{total} projects</span>
                </div>
            </div>

            {/* Projects Table */}
            <div className="admin-projects-table-card">
                <div className="admin-projects-table-wrapper">
                    <table className="admin-projects-table">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Organization</th>
                                <th>Project ID</th>
                                <th>Created</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="admin-projects-loading">
                                            Loading projects...
                                        </div>
                                    </td>
                                </tr>
                            ) : projects.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>
                                        <EmptyMessage
                                            icon={FolderKanban}
                                            title="No projects found"
                                            description={
                                                search || organizationId
                                                    ? "Try changing your search or organization filter."
                                                    : "There are no projects on the platform yet."
                                            }
                                        />
                                    </td>
                                </tr>
                            ) : (
                                projects.map((project) => (
                                    <tr key={project.id}>
                                        {/* Project */}
                                        <td>
                                            <div className="admin-project-name">
                                                <div className="admin-project-icon">
                                                    <FolderKanban size={17} />
                                                </div>

                                                <div>
                                                    <span className="admin-project-title">
                                                        {project.name}
                                                    </span>

                                                    <span className="admin-project-slug">
                                                        {project.slug}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Organization */}
                                        <td>
                                            <span className="admin-project-organization">
                                                {project.organization?.name || "—"}
                                            </span>
                                        </td>

                                        {/* Project ID */}
                                        <td>
                                            <code className="admin-project-id">
                                                {project.id}
                                            </code>
                                        </td>

                                        {/* Created Date */}
                                        <td>
                                            {project.created_at
                                                ? new Date(
                                                    project.created_at
                                                ).toLocaleDateString()
                                                : "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="admin-projects-pagination">
                    <span>
                        {total === 0
                            ? "Showing 0 projects"
                            : `Showing ${(page - 1) * PAGE_SIZE + 1
                            }–${Math.min(
                                page * PAGE_SIZE,
                                total
                            )} of ${total}`}
                    </span>

                    <div className="admin-projects-pagination-actions">
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

                        <span className="admin-projects-page-number">
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
