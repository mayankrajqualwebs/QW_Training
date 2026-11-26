
import { useCallback, useEffect, useState } from "react";
import {
    FolderKanban,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Building2,
    FolderPlus,
    Trash2,
    AlertTriangle,
} from "lucide-react";

import { Alert } from "../components/Alert";
import { EmptyMessage } from "../components/EmptyMessage";
import { Modal } from "../components/Modal";
import { adminService } from "../services/adminService";
import { slugify } from "../utils/string";

const PAGE_SIZE = 20;

function getErrorMessage(err) {
    return (
        err.response?.data?.detail ||
        err.message ||
        "An unexpected error occurred. Please try again."
    );
}

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
    const [notice, setNotice] = useState("");

    // Create Organization Modal State
    const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
    const [orgForm, setOrgForm] = useState({ name: "", slug: "" });
    const [orgSlugManuallyEdited, setOrgSlugManuallyEdited] = useState(false);
    const [orgFieldErrors, setOrgFieldErrors] = useState({});
    const [createOrgError, setCreateOrgError] = useState("");
    const [creatingOrg, setCreatingOrg] = useState(false);

    // Delete Organization Modal State
    const [orgToDelete, setOrgToDelete] = useState(null);
    const [isOrgPickerMode, setIsOrgPickerMode] = useState(false);
    const [selectedOrgIdToDelete, setSelectedOrgIdToDelete] = useState("");
    const [deleteOrgError, setDeleteOrgError] = useState("");
    const [deletingOrg, setDeletingOrg] = useState(false);

    // Create Project Modal State
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [projectForm, setProjectForm] = useState({
        organization_id: "",
        name: "",
        slug: "",
    });
    const [projectSlugManuallyEdited, setProjectSlugManuallyEdited] = useState(false);
    const [projectFieldErrors, setProjectFieldErrors] = useState({});
    const [createProjectError, setCreateProjectError] = useState("");
    const [creatingProject, setCreatingProject] = useState(false);

    // Delete Project Modal State
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deleteProjectError, setDeleteProjectError] = useState("");
    const [deletingProjectId, setDeletingProjectId] = useState(null);

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
            setError(getErrorMessage(err));
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
            console.error("Failed to load organizations:", err);
        }
    }, []);

    useEffect(() => {
        loadOrganizations();
    }, [loadOrganizations]);

    // -------------------------------------------------------------
    // Filter Handlers
    // -------------------------------------------------------------

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };

    const handleOrganizationChange = (value) => {
        setOrganizationId(value);
        setPage(1);
    };

    // -------------------------------------------------------------
    // Create Organization Handlers
    // -------------------------------------------------------------

    const handleOpenCreateOrgModal = () => {
        setOrgForm({ name: "", slug: "" });
        setOrgSlugManuallyEdited(false);
        setOrgFieldErrors({});
        setCreateOrgError("");
        setShowCreateOrgModal(true);
    };

    const handleCloseCreateOrgModal = () => {
        if (creatingOrg) return;
        setShowCreateOrgModal(false);
        setOrgFieldErrors({});
        setCreateOrgError("");
    };

    const validateOrgForm = () => {
        const errors = {};
        const trimmedName = orgForm.name.trim();
        const trimmedSlug = orgForm.slug.trim();
        const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

        if (!trimmedName) {
            errors.name = "Organization name is required.";
        } else if (trimmedName.length < 2 || trimmedName.length > 100) {
            errors.name = "Name must be between 2 and 100 characters.";
        }

        if (!trimmedSlug) {
            errors.slug = "Organization slug is required.";
        } else if (trimmedSlug.length < 2 || trimmedSlug.length > 50) {
            errors.slug = "Slug must be between 2 and 50 characters.";
        } else if (!slugPattern.test(trimmedSlug)) {
            errors.slug = "Slug must consist of lowercase letters, numbers, and single hyphens.";
        }

        return errors;
    };

    const handleCreateOrgSubmit = async (event) => {
        event.preventDefault();
        if (creatingOrg) return;

        const errors = validateOrgForm();
        setOrgFieldErrors(errors);
        setCreateOrgError("");

        if (Object.keys(errors).length > 0) return;

        setCreatingOrg(true);

        try {
            const newOrg = await adminService.createOrganization({
                name: orgForm.name.trim(),
                slug: orgForm.slug.trim().toLowerCase(),
            });

            setShowCreateOrgModal(false);
            setOrgForm({ name: "", slug: "" });
            setNotice(`Organization "${newOrg.name}" was created successfully.`);
            await loadOrganizations();
        } catch (err) {
            setCreateOrgError(getErrorMessage(err));
        } finally {
            setCreatingOrg(false);
        }
    };

    // -------------------------------------------------------------
    // Delete Organization Handlers
    // -------------------------------------------------------------

    const handleOpenDeleteOrgModal = (org) => {
        setOrgToDelete(org);
        setIsOrgPickerMode(false);
        setSelectedOrgIdToDelete(org.id);
        setDeleteOrgError("");
    };

    const handleOpenDeleteOrgPickerModal = () => {
        setOrgToDelete({ name: "Select an Organization", id: "" });
        setIsOrgPickerMode(true);
        setSelectedOrgIdToDelete(organizationId || "");
        setDeleteOrgError("");
    };

    const handleCloseDeleteOrgModal = () => {
        if (deletingOrg) return;
        setOrgToDelete(null);
        setIsOrgPickerMode(false);
        setSelectedOrgIdToDelete("");
        setDeleteOrgError("");
    };

    const confirmDeleteOrganization = async () => {
        const targetId = isOrgPickerMode ? selectedOrgIdToDelete : orgToDelete?.id;
        if (!targetId || deletingOrg) return;

        const targetOrg = organizations.find((o) => o.id === targetId) || orgToDelete;
        setDeletingOrg(true);
        setDeleteOrgError("");

        try {
            await adminService.deleteOrganization(targetId);

            const deletedName = targetOrg?.name || "Organization";
            setOrgToDelete(null);
            setIsOrgPickerMode(false);
            setSelectedOrgIdToDelete("");

            // If deleted organization was filtered, reset filter
            if (organizationId === targetId) {
                setOrganizationId("");
            }

            setNotice(`Organization "${deletedName}" was successfully deleted.`);
            await Promise.all([loadOrganizations(), loadProjects()]);
        } catch (err) {
            setDeleteOrgError(getErrorMessage(err));
        } finally {
            setDeletingOrg(false);
        }
    };

    // -------------------------------------------------------------
    // Create Project Handlers
    // -------------------------------------------------------------

    const handleOpenCreateProjectModal = () => {
        setProjectForm({
            organization_id: organizationId || (organizations[0]?.id ?? ""),
            name: "",
            slug: "",
        });
        setProjectSlugManuallyEdited(false);
        setProjectFieldErrors({});
        setCreateProjectError("");
        setShowCreateProjectModal(true);
    };

    const handleCloseCreateProjectModal = () => {
        if (creatingProject) return;
        setShowCreateProjectModal(false);
        setProjectFieldErrors({});
        setCreateProjectError("");
    };

    const validateProjectForm = () => {
        const errors = {};
        const trimmedName = projectForm.name.trim();
        const trimmedSlug = projectForm.slug.trim();
        const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

        if (!projectForm.organization_id) {
            errors.organization_id = "Please select an organization.";
        }

        if (!trimmedName) {
            errors.name = "Project name is required.";
        } else if (trimmedName.length < 2 || trimmedName.length > 100) {
            errors.name = "Name must be between 2 and 100 characters.";
        }

        if (!trimmedSlug) {
            errors.slug = "Project slug is required.";
        } else if (trimmedSlug.length < 2 || trimmedSlug.length > 50) {
            errors.slug = "Slug must be between 2 and 50 characters.";
        } else if (!slugPattern.test(trimmedSlug)) {
            errors.slug = "Slug must consist of lowercase letters, numbers, and single hyphens.";
        }

        return errors;
    };

    const handleCreateProjectSubmit = async (event) => {
        event.preventDefault();
        if (creatingProject) return;

        const errors = validateProjectForm();
        setProjectFieldErrors(errors);
        setCreateProjectError("");

        if (Object.keys(errors).length > 0) return;

        setCreatingProject(true);

        try {
            const newProject = await adminService.createProject({
                organization_id: projectForm.organization_id,
                name: projectForm.name.trim(),
                slug: projectForm.slug.trim().toLowerCase(),
            });

            setShowCreateProjectModal(false);
            setProjectForm({ organization_id: "", name: "", slug: "" });
            setNotice(`Project "${newProject.name}" was created successfully.`);
            await loadProjects();
        } catch (err) {
            setCreateProjectError(getErrorMessage(err));
        } finally {
            setCreatingProject(false);
        }
    };

    // -------------------------------------------------------------
    // Delete Project Handlers
    // -------------------------------------------------------------

    const handleOpenDeleteProjectModal = (project) => {
        setProjectToDelete(project);
        setDeleteProjectError("");
    };

    const handleCloseDeleteProjectModal = () => {
        if (deletingProjectId) return;
        setProjectToDelete(null);
        setDeleteProjectError("");
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete || deletingProjectId) return;

        setDeletingProjectId(projectToDelete.id);
        setDeleteProjectError("");

        try {
            await adminService.deleteProject(projectToDelete.id);

            const deletedName = projectToDelete.name;
            setProjectToDelete(null);
            setNotice(`Project "${deletedName}" was successfully deleted.`);
            await loadProjects();
        } catch (err) {
            setDeleteProjectError(getErrorMessage(err));
        } finally {
            setDeletingProjectId(null);
        }
    };

    // -------------------------------------------------------------
    // Render
    // -------------------------------------------------------------

    const selectedOrg = organizations.find((o) => o.id === organizationId);

    return (
        <div className="admin-projects">
            {/* Header */}
            <div className="admin-projects-header">
                <div>
                    <h1>Platform Projects & Organizations</h1>
                    <p>Manage multi-tenant organizations and scoped projects.</p>
                </div>

                <div className="admin-projects-header-actions">
                    <button
                        className="btn-secondary"
                        onClick={loadProjects}
                        disabled={loading}
                        type="button"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        className="admin-btn-secondary"
                        onClick={handleOpenCreateOrgModal}
                        type="button"
                        title="Create a new organization workspace"
                    >
                        <Building2 size={16} />
                        Create Organization
                    </button>

                    <button
                        className="admin-btn-primary"
                        onClick={handleOpenCreateProjectModal}
                        type="button"
                        title="Create a new project"
                    >
                        <FolderPlus size={16} />
                        Create Project
                    </button>
                </div>
            </div>

            {/* Error and Success Alerts */}
            {error && (
                <Alert
                    type="error"
                    message={error}
                    onDismiss={() => setError("")}
                />
            )}

            {notice && (
                <Alert
                    type="success"
                    message={notice}
                    onDismiss={() => setNotice("")}
                />
            )}

            {/* Search and Filters */}
            <div className="admin-projects-toolbar">
                {/* Search */}
                <div className="admin-projects-search">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search projects by name..."
                        value={search}
                        onChange={(event) =>
                            handleSearchChange(event.target.value)
                        }
                    />
                </div>

                {/* Organization Filter with Delete Option */}
                <div className="admin-projects-org-filter-wrapper">
                    <select
                        className="admin-projects-organization-filter"
                        value={organizationId}
                        onChange={(event) =>
                            handleOrganizationChange(event.target.value)
                        }
                        aria-label="Filter by organization"
                    >
                        <option value="">
                            All Organizations ({organizations.length})
                        </option>

                        {organizations.map((org) => (
                            <option
                                key={org.id}
                                value={org.id}
                            >
                                {org.name}
                            </option>
                        ))}
                    </select>

                    <button
                        className={`admin-btn-delete-org ${!organizationId ? "admin-btn-delete-org-picker" : ""}`}
                        onClick={() => {
                            if (organizationId && selectedOrg) {
                                handleOpenDeleteOrgModal(selectedOrg);
                            } else {
                                handleOpenDeleteOrgPickerModal();
                            }
                        }}
                        type="button"
                        title={organizationId ? `Delete ${selectedOrg?.name || "selected organization"}` : "Delete an organization..."}
                    >
                        <Trash2 size={15} />
                        {organizationId ? "Delete Org" : "Delete Org..."}
                    </button>
                </div>

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
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="admin-projects-loading">
                                            Loading projects...
                                        </div>
                                    </td>
                                </tr>
                            ) : projects.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
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

                                        {/* Actions */}
                                        <td>
                                            <button
                                                className="admin-project-delete-btn"
                                                onClick={() => handleOpenDeleteProjectModal(project)}
                                                disabled={Boolean(deletingProjectId)}
                                                title="Delete project"
                                                type="button"
                                            >
                                                <Trash2 size={13} />
                                                Delete
                                            </button>
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
                            type="button"
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
                            type="button"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Organization Modal */}
            {showCreateOrgModal && (
                <Modal
                    title="Create Organization"
                    onClose={handleCloseCreateOrgModal}
                >
                    <form
                        onSubmit={handleCreateOrgSubmit}
                        className="admin-modal-form"
                        noValidate
                    >
                        {createOrgError && (
                            <Alert
                                type="error"
                                message={createOrgError}
                                onDismiss={() => setCreateOrgError("")}
                            />
                        )}

                        <div className="admin-form-group">
                            <label htmlFor="create-org-name">
                                Organization Name <span className="required">*</span>
                            </label>
                            <input
                                id="create-org-name"
                                type="text"
                                placeholder="Acme Corporation"
                                value={orgForm.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setOrgForm((prev) => ({
                                        ...prev,
                                        name: val,
                                        slug: orgSlugManuallyEdited ? prev.slug : slugify(val),
                                    }));
                                    if (orgFieldErrors.name) {
                                        setOrgFieldErrors((prev) => ({ ...prev, name: "" }));
                                    }
                                }}
                                disabled={creatingOrg}
                                autoFocus
                            />
                            {orgFieldErrors.name && (
                                <span className="field-error">{orgFieldErrors.name}</span>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="create-org-slug">
                                Organization Slug <span className="required">*</span>
                            </label>
                            <input
                                id="create-org-slug"
                                type="text"
                                placeholder="acme-corporation"
                                value={orgForm.slug}
                                onChange={(e) => {
                                    setOrgSlugManuallyEdited(true);
                                    setOrgForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                                    if (orgFieldErrors.slug) {
                                        setOrgFieldErrors((prev) => ({ ...prev, slug: "" }));
                                    }
                                }}
                                disabled={creatingOrg}
                            />
                            <span className="field-hint">
                                URL-friendly unique identifier (lowercase alphanumeric and hyphens).
                            </span>
                            {orgFieldErrors.slug && (
                                <span className="field-error">{orgFieldErrors.slug}</span>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseCreateOrgModal}
                                disabled={creatingOrg}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn-primary admin-btn-submit"
                                disabled={creatingOrg}
                            >
                                {creatingOrg ? "Creating..." : "Create Organization"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Organization Modal */}
            {orgToDelete && (
                <Modal
                    title="Delete Organization"
                    onClose={handleCloseDeleteOrgModal}
                >
                    <div className="admin-delete-modal">
                        {deleteOrgError && (
                            <Alert
                                type="error"
                                message={deleteOrgError}
                                onDismiss={() => setDeleteOrgError("")}
                            />
                        )}

                        <div className="admin-delete-warning">
                            <AlertTriangle size={18} className="admin-delete-warning-icon" />
                            <div>
                                <strong>Destructive Action</strong>
                                <p>
                                    Deleting an organization affects associated projects, API keys, documents, members, and related records. If any associated projects exist, deletion will be blocked to maintain data integrity.
                                </p>
                            </div>
                        </div>

                        {isOrgPickerMode ? (
                            <div className="admin-form-group">
                                <label htmlFor="delete-org-select">
                                    Select Organization to Delete <span className="required">*</span>
                                </label>
                                <select
                                    id="delete-org-select"
                                    value={selectedOrgIdToDelete}
                                    onChange={(e) => {
                                        setSelectedOrgIdToDelete(e.target.value);
                                        setDeleteOrgError("");
                                    }}
                                    disabled={deletingOrg}
                                >
                                    <option value="">-- Choose an Organization --</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name} ({org.slug || org.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                <p className="admin-delete-prompt">
                                    Are you sure you want to permanently delete this organization?
                                </p>

                                <div className="admin-role-modal-user">
                                    <div className="admin-project-icon">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <strong>{orgToDelete.name}</strong>
                                        <span>Slug: {orgToDelete.slug || "—"} &bull; ID: {orgToDelete.id}</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseDeleteOrgModal}
                                disabled={deletingOrg}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-danger admin-btn-danger"
                                onClick={confirmDeleteOrganization}
                                disabled={deletingOrg || (isOrgPickerMode && !selectedOrgIdToDelete)}
                            >
                                {deletingOrg ? "Deleting..." : "Delete Organization"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <Modal
                    title="Create Project"
                    onClose={handleCloseCreateProjectModal}
                >
                    <form
                        onSubmit={handleCreateProjectSubmit}
                        className="admin-modal-form"
                        noValidate
                    >
                        {createProjectError && (
                            <Alert
                                type="error"
                                message={createProjectError}
                                onDismiss={() => setCreateProjectError("")}
                            />
                        )}

                        <div className="admin-form-group">
                            <label htmlFor="create-proj-org">
                                Organization <span className="required">*</span>
                            </label>
                            <select
                                id="create-proj-org"
                                value={projectForm.organization_id}
                                onChange={(e) => {
                                    setProjectForm((prev) => ({ ...prev, organization_id: e.target.value }));
                                    if (projectFieldErrors.organization_id) {
                                        setProjectFieldErrors((prev) => ({ ...prev, organization_id: "" }));
                                    }
                                }}
                                disabled={creatingProject}
                            >
                                <option value="">-- Select Organization --</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            {projectFieldErrors.organization_id && (
                                <span className="field-error">{projectFieldErrors.organization_id}</span>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="create-proj-name">
                                Project Name <span className="required">*</span>
                            </label>
                            <input
                                id="create-proj-name"
                                type="text"
                                placeholder="Mobile Backend API"
                                value={projectForm.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setProjectForm((prev) => ({
                                        ...prev,
                                        name: val,
                                        slug: projectSlugManuallyEdited ? prev.slug : slugify(val),
                                    }));
                                    if (projectFieldErrors.name) {
                                        setProjectFieldErrors((prev) => ({ ...prev, name: "" }));
                                    }
                                }}
                                disabled={creatingProject}
                            />
                            {projectFieldErrors.name && (
                                <span className="field-error">{projectFieldErrors.name}</span>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="create-proj-slug">
                                Project Slug <span className="required">*</span>
                            </label>
                            <input
                                id="create-proj-slug"
                                type="text"
                                placeholder="mobile-backend-api"
                                value={projectForm.slug}
                                onChange={(e) => {
                                    setProjectSlugManuallyEdited(true);
                                    setProjectForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                                    if (projectFieldErrors.slug) {
                                        setProjectFieldErrors((prev) => ({ ...prev, slug: "" }));
                                    }
                                }}
                                disabled={creatingProject}
                            />
                            <span className="field-hint">
                                Unique identifier within the selected organization.
                            </span>
                            {projectFieldErrors.slug && (
                                <span className="field-error">{projectFieldErrors.slug}</span>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseCreateProjectModal}
                                disabled={creatingProject}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn-primary admin-btn-submit"
                                disabled={creatingProject}
                            >
                                {creatingProject ? "Creating..." : "Create Project"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Project Modal */}
            {projectToDelete && (
                <Modal
                    title="Delete Project"
                    onClose={handleCloseDeleteProjectModal}
                >
                    <div className="admin-delete-modal">
                        {deleteProjectError && (
                            <Alert
                                type="error"
                                message={deleteProjectError}
                                onDismiss={() => setDeleteProjectError("")}
                            />
                        )}

                        <div className="admin-delete-warning">
                            <AlertTriangle size={18} className="admin-delete-warning-icon" />
                            <div>
                                <strong>Destructive Action</strong>
                                <p>
                                    Deleting this project is irreversible. If this project has associated documents, API keys, or request logs, deletion will be blocked to maintain data integrity.
                                </p>
                            </div>
                        </div>

                        <p className="admin-delete-prompt">
                            Are you sure you want to permanently delete this project?
                        </p>

                        <div className="admin-role-modal-user">
                            <div className="admin-project-icon">
                                <FolderKanban size={18} />
                            </div>
                            <div>
                                <strong>{projectToDelete.name}</strong>
                                <span>Organization: {projectToDelete.organization?.name || "—"} &bull; Slug: {projectToDelete.slug}</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseDeleteProjectModal}
                                disabled={Boolean(deletingProjectId)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-danger admin-btn-danger"
                                onClick={confirmDeleteProject}
                                disabled={Boolean(deletingProjectId)}
                            >
                                {deletingProjectId ? "Deleting..." : "Delete Project"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
