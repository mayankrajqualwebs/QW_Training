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
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await adminService.getProjects({
                search: search.trim() || undefined,
                page,
                page_size: PAGE_SIZE,
            });

            const data = response.data;

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
    }, [search, page]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };


    return (
        <div className="admin-projects">
            <div className="admin-projects-header">
                {/* <div>
                    <h1>Projects Management</h1>
                    <p>
                        Manage and monitor projects across all organizations.
                    </p>
                </div> */}

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

            {error && (
                <Alert
                    type="error"
                    message={error}
                />
            )}

            <div className="admin-projects-toolbar">
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

                <div className="admin-projects-count">
                    <FolderKanban size={17} />
                    <span>{total} projects</span>
                </div>
            </div>

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
                                                search
                                                    ? "Try adjusting your search."
                                                    : "There are no projects on the platform yet."
                                            }
                                        />
                                    </td>
                                </tr>
                            ) : (
                                projects.map((project) => (
                                    <tr key={project.id}>
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

                                        <td>
                                            <span className="admin-project-organization">
                                                {project.organization?.name || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <code className="admin-project-id">
                                                {project.id}
                                            </code>
                                        </td>

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

                <div className="admin-projects-pagination">
                    <span>
                        {total === 0
                            ? "Showing 0 projects"
                            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                                page * PAGE_SIZE,
                                total
                            )} of ${total}`}
                    </span>

                    <div className="admin-projects-pagination-actions">
                        <button
                            className="btn-secondary"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => current - 1)}
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
                            onClick={() => setPage((current) => current + 1)}
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