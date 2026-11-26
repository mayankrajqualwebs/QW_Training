import { useCallback, useEffect, useState } from "react";
import {
    FileText,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    UploadCloud,
    Eye,
    Download,
    Edit2,
    Trash2,
    AlertTriangle,
    Layers,
    Building2,
    FolderKanban,
    User,
    Calendar,
    HardDrive,
    Info,
} from "lucide-react";

import { Alert } from "../components/Alert";
import { EmptyMessage } from "../components/EmptyMessage";
import { Modal } from "../components/Modal/Modal";
import { adminService } from "../services/adminService";

const PAGE_SIZE = 20;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes) {
    if (bytes == null || bytes === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }
    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getErrorMessage(err, fallback = "An unexpected error occurred.") {
    if (!err) return fallback;
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
    return err.message || fallback;
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
    const [notice, setNotice] = useState("");

    // Action loading states
    const [downloadingId, setDownloadingId] = useState(null);

    // -------------------------------------------------------------
    // Upload Modal State
    // -------------------------------------------------------------
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        organizationId: "",
        projectId: "",
        name: "",
    });
    const [uploadProjects, setUploadProjects] = useState([]);
    const [loadingUploadProjects, setLoadingUploadProjects] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    // -------------------------------------------------------------
    // View Details Modal State
    // -------------------------------------------------------------
    const [viewDocument, setViewDocument] = useState(null);
    const [documentDetails, setDocumentDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    // -------------------------------------------------------------
    // Edit Metadata Modal State
    // -------------------------------------------------------------
    const [editDocument, setEditDocument] = useState(null);
    const [editForm, setEditForm] = useState({ name: "" });
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState("");

    // -------------------------------------------------------------
    // Delete Confirmation Modal State
    // -------------------------------------------------------------
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
            setError(getErrorMessage(err, "Failed to load documents."));
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
            console.error("Failed to load organizations:", err);
        }
    }, []);

    useEffect(() => {
        loadOrganizations();
    }, [loadOrganizations]);

    // -------------------------------------------------------------
    // Load Filter Projects
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
            console.error("Failed to load projects:", err);
        }
    }, [organizationId]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // -------------------------------------------------------------
    // Load Projects for Upload Form Organization
    // -------------------------------------------------------------
    const loadUploadProjects = useCallback(async (orgId) => {
        if (!orgId) {
            setUploadProjects([]);
            return;
        }
        setLoadingUploadProjects(true);
        try {
            const data = await adminService.getProjects({
                organization_id: orgId,
                page: 1,
                page_size: 100,
            });
            setUploadProjects(data.projects ?? []);
        } catch (err) {
            console.error("Failed to load projects for upload:", err);
            setUploadProjects([]);
        } finally {
            setLoadingUploadProjects(false);
        }
    }, []);

    // -------------------------------------------------------------
    // Filter Handlers
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
    // Upload Handlers
    // -------------------------------------------------------------
    const handleOpenUploadModal = () => {
        const initialOrgId = organizationId || (organizations[0]?.id ?? "");
        setUploadForm({
            organizationId: initialOrgId,
            projectId: projectId || "",
            name: "",
        });
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadError("");
        setShowUploadModal(true);

        if (initialOrgId) {
            loadUploadProjects(initialOrgId);
        }
    };

    const handleCloseUploadModal = () => {
        if (uploading) return;
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadError("");
    };

    const handleUploadOrgChange = (orgId) => {
        setUploadForm((prev) => ({
            ...prev,
            organizationId: orgId,
            projectId: "",
        }));
        loadUploadProjects(orgId);
    };

    const handleFileSelected = (e) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setUploadError("");
        if (file && !uploadForm.name) {
            setUploadForm((prev) => ({
                ...prev,
                name: file.name,
            }));
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        setUploadError("");

        if (!selectedFile) {
            setUploadError("Please select a file to upload.");
            return;
        }

        if (!uploadForm.organizationId) {
            setUploadError("Please select an organization.");
            return;
        }

        if (!uploadForm.projectId) {
            setUploadError("Please select a project.");
            return;
        }

        if (selectedFile.size <= 0) {
            setUploadError("The selected file is empty.");
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
            setUploadError("File size exceeds the maximum limit of 10 MB.");
            return;
        }

        const ext = ("." + (selectedFile.name.split(".").pop() || "")).toLowerCase();
        if (ext !== ".pdf" && ext !== ".docx") {
            setUploadError("Only PDF and DOCX documents (.pdf, .docx) are supported.");
            return;
        }

        const docName = (uploadForm.name.trim() || selectedFile.name).trim();
        const docExt = ("." + (docName.split(".").pop() || "")).toLowerCase();
        if (docExt !== ext) {
            setUploadError(`The document name must end with the matching file extension '${ext}'.`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("project_id", uploadForm.projectId);
        formData.append("name", docName);

        try {
            await adminService.uploadDocument(formData, (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            setNotice(`Document "${docName}" uploaded successfully.`);
            handleCloseUploadModal();
            await loadDocuments();
        } catch (err) {
            setUploadError(getErrorMessage(err, "Failed to upload document."));
        } finally {
            setUploading(false);
        }
    };

    // -------------------------------------------------------------
    // View Details Handlers
    // -------------------------------------------------------------
    const handleOpenViewDetails = async (doc) => {
        setViewDocument(doc);
        setDocumentDetails(null);
        setDetailsError("");
        setDetailsLoading(true);

        try {
            const data = await adminService.getDocument(doc.id);
            setDocumentDetails(data);
        } catch (err) {
            setDetailsError(getErrorMessage(err, "Failed to load document details."));
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleCloseViewDetails = () => {
        setViewDocument(null);
        setDocumentDetails(null);
        setDetailsError("");
    };

    // -------------------------------------------------------------
    // Edit Metadata Handlers
    // -------------------------------------------------------------
    const handleOpenEditModal = (doc) => {
        setEditDocument(doc);
        setEditForm({ name: doc.name });
        setEditError("");
    };

    const handleCloseEditModal = () => {
        if (editing) return;
        setEditDocument(null);
        setEditError("");
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editDocument) return;

        const trimmedName = editForm.name.trim();
        if (!trimmedName) {
            setEditError("Document name cannot be empty.");
            return;
        }

        const oldExt = ("." + (editDocument.original_name || editDocument.name).split(".").pop() || "").toLowerCase();
        const newExt = ("." + (trimmedName.split(".").pop() || "")).toLowerCase();
        if (oldExt && oldExt !== newExt) {
            setEditError(`Cannot change file extension. Name must end with '${oldExt}'.`);
            return;
        }

        setEditing(true);
        setEditError("");

        try {
            await adminService.updateDocument(editDocument.id, {
                name: trimmedName,
            });

            setNotice(`Document renamed to "${trimmedName}".`);
            handleCloseEditModal();
            await loadDocuments();
        } catch (err) {
            setEditError(getErrorMessage(err, "Failed to update document."));
        } finally {
            setEditing(false);
        }
    };

    // -------------------------------------------------------------
    // Download / Preview Handlers
    // -------------------------------------------------------------
    const handleDownload = async (doc) => {
        if (!doc?.id) return;
        setDownloadingId(doc.id);
        setError("");

        try {
            const data = await adminService.getDocumentDownloadUrl(doc.id);
            if (data.download_url) {
                const link = document.createElement("a");
                link.href = data.download_url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.download = data.filename || doc.original_name || doc.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                setError("No download URL returned by server.");
            }
        } catch (err) {
            setError(getErrorMessage(err, "Failed to download document."));
        } finally {
            setDownloadingId(null);
        }
    };

    // -------------------------------------------------------------
    // Delete Handlers
    // -------------------------------------------------------------
    const handleOpenDeleteModal = (doc) => {
        setDocumentToDelete(doc);
        setDeleteError("");
    };

    const handleCloseDeleteModal = () => {
        if (deleting) return;
        setDocumentToDelete(null);
        setDeleteError("");
    };

    const handleDeleteSubmit = async () => {
        if (!documentToDelete) return;

        setDeleting(true);
        setDeleteError("");

        try {
            await adminService.deleteDocument(documentToDelete.id);
            const deletedName = documentToDelete.name;
            setDocumentToDelete(null);
            setNotice(`Document "${deletedName}" was permanently deleted.`);
            await loadDocuments();
        } catch (err) {
            setDeleteError(getErrorMessage(err, "Failed to delete document."));
        } finally {
            setDeleting(false);
        }
    };

    // -------------------------------------------------------------
    // UI Render
    // -------------------------------------------------------------
    return (
        <div className="admin-documents">
            {/* Header */}
            <div className="admin-documents-header">
                <div>
                    <h1>Documents Management</h1>
                    <p>Manage, inspect, and organize files stored across the platform.</p>
                </div>

                <div className="admin-documents-header-actions">
                    <button
                        className="btn-secondary"
                        onClick={loadDocuments}
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
                        className="admin-btn-primary"
                        onClick={handleOpenUploadModal}
                        type="button"
                        title="Upload a new document to a project"
                    >
                        <UploadCloud size={16} />
                        Upload Document
                    </button>
                </div>
            </div>

            {/* Notifications */}
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

            {/* Toolbar */}
            <div className="admin-documents-toolbar">
                <div className="admin-documents-search">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search documents by name..."
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
                    aria-label="Filter by organization"
                >
                    <option value="">All Organizations</option>

                    {organizations.map((org) => (
                        <option
                            key={org.id}
                            value={org.id}
                        >
                            {org.name}
                        </option>
                    ))}
                </select>

                <select
                    className="admin-documents-filter"
                    value={projectId}
                    onChange={(event) =>
                        handleProjectChange(event.target.value)
                    }
                    aria-label="Filter by project"
                >
                    <option value="">All Projects</option>

                    {projects.map((proj) => (
                        <option
                            key={proj.id}
                            value={proj.id}
                        >
                            {proj.name}
                        </option>
                    ))}
                </select>

                <div className="admin-documents-count">
                    <FileText size={17} />
                    <span>{total} documents</span>
                </div>
            </div>

            {/* Documents Table */}
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
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="admin-documents-loading">
                                            Loading documents...
                                        </div>
                                    </td>
                                </tr>
                            ) : documents.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyMessage
                                            icon={FileText}
                                            title="No documents found"
                                            description={
                                                search || organizationId || projectId
                                                    ? "Try changing your search or filters."
                                                    : "There are no documents on the platform yet."
                                            }
                                        />
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id}>
                                        <td>
                                            <div className="admin-document-name">
                                                <div className="admin-document-icon">
                                                    <FileText size={17} />
                                                </div>

                                                <div>
                                                    <span className="admin-document-title">
                                                        {doc.name}
                                                    </span>

                                                    <span className="admin-document-original">
                                                        {doc.original_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{doc.organization_name}</td>

                                        <td>{doc.project_name}</td>

                                        <td>{formatFileSize(doc.size)}</td>

                                        <td>
                                            <span
                                                className={`admin-document-status status-${String(
                                                    doc.status
                                                ).toLowerCase()}`}
                                            >
                                                {doc.status}
                                            </span>
                                        </td>

                                        <td>v{doc.current_version}</td>

                                        <td>{formatDate(doc.created_at)}</td>

                                        <td>
                                            <div className="admin-doc-actions-cell">
                                                {/* View Details */}
                                                <button
                                                    type="button"
                                                    className="admin-doc-action-btn admin-doc-view-btn"
                                                    onClick={() => handleOpenViewDetails(doc)}
                                                    title="View details & versions"
                                                >
                                                    <Eye size={14} />
                                                    <span>View</span>
                                                </button>

                                                {/* Download */}
                                                <button
                                                    type="button"
                                                    className="admin-doc-action-btn admin-doc-download-btn"
                                                    onClick={() => handleDownload(doc)}
                                                    disabled={downloadingId === doc.id || doc.status !== "UPLOADED"}
                                                    title={
                                                        doc.status === "UPLOADED"
                                                            ? "Download document"
                                                            : "Not available for download"
                                                    }
                                                >
                                                    <Download
                                                        size={14}
                                                        className={downloadingId === doc.id ? "spin" : ""}
                                                    />
                                                    <span>{downloadingId === doc.id ? "..." : "Download"}</span>
                                                </button>

                                                {/* Edit Metadata */}
                                                <button
                                                    type="button"
                                                    className="admin-doc-action-btn admin-doc-edit-btn"
                                                    onClick={() => handleOpenEditModal(doc)}
                                                    title="Edit document display name"
                                                >
                                                    <Edit2 size={13} />
                                                    <span>Edit</span>
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    className="admin-doc-action-btn admin-doc-delete-btn"
                                                    onClick={() => handleOpenDeleteModal(doc)}
                                                    title="Delete document"
                                                >
                                                    <Trash2 size={13} />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="admin-documents-pagination">
                    <span>
                        {total === 0
                            ? "Showing 0 documents"
                            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                                  page * PAGE_SIZE,
                                  total
                              )} of ${total}`}
                    </span>

                    <div className="admin-documents-pagination-actions">
                        <button
                            className="btn-secondary"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => current - 1)}
                            type="button"
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
                            onClick={() => setPage((current) => current + 1)}
                            type="button"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================= */}
            {/* Upload Document Modal                                         */}
            {/* ============================================================= */}
            {showUploadModal && (
                <Modal
                    title="Upload Document"
                    onClose={handleCloseUploadModal}
                >
                    <form
                        onSubmit={handleUploadSubmit}
                        className="admin-modal-form"
                        noValidate
                    >
                        {uploadError && (
                            <Alert
                                type="error"
                                message={uploadError}
                                onDismiss={() => setUploadError("")}
                            />
                        )}

                        <div className="admin-form-group">
                            <label htmlFor="upload-org-select">
                                Target Organization <span className="required">*</span>
                            </label>
                            <select
                                id="upload-org-select"
                                value={uploadForm.organizationId}
                                onChange={(e) => handleUploadOrgChange(e.target.value)}
                                disabled={uploading}
                            >
                                <option value="">Select Organization</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="upload-project-select">
                                Target Project <span className="required">*</span>
                            </label>
                            <select
                                id="upload-project-select"
                                value={uploadForm.projectId}
                                onChange={(e) =>
                                    setUploadForm((prev) => ({
                                        ...prev,
                                        projectId: e.target.value,
                                    }))
                                }
                                disabled={uploading || !uploadForm.organizationId || loadingUploadProjects}
                            >
                                <option value="">
                                    {loadingUploadProjects
                                        ? "Loading projects..."
                                        : !uploadForm.organizationId
                                        ? "Select an organization first"
                                        : uploadProjects.length === 0
                                        ? "No projects found in this organization"
                                        : "Select Project"}
                                </option>
                                {uploadProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="upload-file-input">
                                File Selection <span className="required">*</span>
                            </label>
                            <div className="admin-file-input-wrapper">
                                <input
                                    id="upload-file-input"
                                    type="file"
                                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileSelected}
                                    disabled={uploading}
                                />
                                <span className="field-hint">
                                    Supported formats: PDF (.pdf) and Microsoft Word (.docx). Max size: 10 MB.
                                </span>
                            </div>

                            {selectedFile && (
                                <div className="admin-selected-file-badge">
                                    <FileText size={16} />
                                    <div className="admin-selected-file-info">
                                        <span className="file-name">{selectedFile.name}</span>
                                        <span className="file-meta">
                                            {formatFileSize(selectedFile.size)} • {selectedFile.type || "application/octet-stream"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="upload-doc-name">Document Display Name</label>
                            <input
                                id="upload-doc-name"
                                type="text"
                                placeholder={selectedFile?.name || "e.g. Annual-Report-2026.pdf"}
                                value={uploadForm.name}
                                onChange={(e) =>
                                    setUploadForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                disabled={uploading}
                            />
                            <span className="field-hint">
                                Optional display name. Defaults to the uploaded filename.
                            </span>
                        </div>

                        {uploading && (
                            <div className="admin-upload-progress-container">
                                <div className="admin-upload-progress-bar">
                                    <div
                                        className="admin-upload-progress-fill"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="admin-upload-progress-text">
                                    Uploading to storage... {uploadProgress}%
                                </span>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseUploadModal}
                                disabled={uploading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="admin-btn-primary"
                                disabled={
                                    uploading ||
                                    !selectedFile ||
                                    !uploadForm.organizationId ||
                                    !uploadForm.projectId
                                }
                            >
                                <UploadCloud size={16} />
                                {uploading ? "Uploading..." : "Upload Document"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ============================================================= */}
            {/* View Document Details Modal                                   */}
            {/* ============================================================= */}
            {viewDocument && (
                <Modal
                    title="Document Details"
                    onClose={handleCloseViewDetails}
                >
                    <div className="admin-modal-body admin-doc-details-body">
                        {detailsError && (
                            <Alert
                                type="error"
                                message={detailsError}
                                onDismiss={() => setDetailsError("")}
                            />
                        )}

                        {detailsLoading ? (
                            <div className="admin-documents-loading">
                                Loading document metadata...
                            </div>
                        ) : (
                            <>
                                <div className="admin-doc-details-grid">
                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <FileText size={14} /> Document Name
                                        </span>
                                        <span className="detail-value highlight">
                                            {documentDetails?.name || viewDocument.name}
                                        </span>
                                    </div>

                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <HardDrive size={14} /> Original Filename
                                        </span>
                                        <span className="detail-value">
                                            {documentDetails?.original_name || viewDocument.original_name}
                                        </span>
                                    </div>

                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <Building2 size={14} /> Organization
                                        </span>
                                        <span className="detail-value">
                                            {documentDetails?.organization_name || viewDocument.organization_name}
                                        </span>
                                    </div>

                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <FolderKanban size={14} /> Project
                                        </span>
                                        <span className="detail-value">
                                            {documentDetails?.project_name || viewDocument.project_name}
                                        </span>
                                    </div>

                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <Layers size={14} /> File Size & Type
                                        </span>
                                        <span className="detail-value">
                                            {formatFileSize(documentDetails?.size || viewDocument.size)} (
                                            {documentDetails?.content_type || viewDocument.content_type})
                                        </span>
                                    </div>

                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <Info size={14} /> Status & Version
                                        </span>
                                        <span className="detail-value">
                                            <span
                                                className={`admin-document-status status-${String(
                                                    documentDetails?.status || viewDocument.status
                                                ).toLowerCase()}`}
                                            >
                                                {documentDetails?.status || viewDocument.status}
                                            </span>{" "}
                                            • Version {documentDetails?.current_version || viewDocument.current_version}
                                        </span>
                                    </div>

                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <User size={14} /> Uploaded By
                                        </span>
                                        <span className="detail-value">
                                            {documentDetails?.uploaded_by_email ||
                                                viewDocument.uploaded_by_email ||
                                                documentDetails?.uploaded_by_id ||
                                                viewDocument.uploaded_by_id ||
                                                "—"}
                                        </span>
                                    </div>

                                    <div className="admin-doc-detail-item">
                                        <span className="detail-label">
                                            <Calendar size={14} /> Created At
                                        </span>
                                        <span className="detail-value">
                                            {formatDate(documentDetails?.created_at || viewDocument.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Version History */}
                                <div className="admin-doc-versions-section">
                                    <h4>Version History</h4>
                                    {(!documentDetails?.versions || documentDetails.versions.length === 0) ? (
                                        <p className="admin-doc-versions-empty">
                                            No additional version records found. Current active version: v{documentDetails?.current_version || viewDocument.current_version}.
                                        </p>
                                    ) : (
                                        <table className="admin-doc-versions-table">
                                            <thead>
                                                <tr>
                                                    <th>Version</th>
                                                    <th>Size</th>
                                                    <th>Uploaded By</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {documentDetails.versions.map((ver) => (
                                                    <tr key={ver.id || ver.version_number}>
                                                        <td>
                                                            <strong>v{ver.version_number}</strong>
                                                            {ver.version_number === documentDetails.current_version && (
                                                                <span className="current-badge">Active</span>
                                                            )}
                                                        </td>
                                                        <td>{formatFileSize(ver.size)}</td>
                                                        <td>{ver.uploaded_by_email || ver.uploaded_by_id || "—"}</td>
                                                        <td>{formatDate(ver.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        onClick={() => {
                                            const doc = viewDocument;
                                            handleCloseViewDetails();
                                            handleOpenEditModal(doc);
                                        }}
                                    >
                                        <Edit2 size={15} />
                                        Edit Name
                                    </button>

                                    <button
                                        type="button"
                                        className="admin-btn-primary"
                                        onClick={() => handleDownload(viewDocument)}
                                        disabled={downloadingId === viewDocument.id}
                                    >
                                        <Download
                                            size={15}
                                            className={downloadingId === viewDocument.id ? "spin" : ""}
                                        />
                                        Download Document
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleCloseViewDetails}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            )}

            {/* ============================================================= */}
            {/* Edit Metadata Modal                                           */}
            {/* ============================================================= */}
            {editDocument && (
                <Modal
                    title="Edit Document"
                    onClose={handleCloseEditModal}
                >
                    <form
                        onSubmit={handleEditSubmit}
                        className="admin-modal-form"
                        noValidate
                    >
                        {editError && (
                            <Alert
                                type="error"
                                message={editError}
                                onDismiss={() => setEditError("")}
                            />
                        )}

                        <div className="admin-form-group">
                            <label htmlFor="edit-doc-name">
                                Document Display Name <span className="required">*</span>
                            </label>
                            <input
                                id="edit-doc-name"
                                type="text"
                                value={editForm.name}
                                onChange={(e) =>
                                    setEditForm({ name: e.target.value })
                                }
                                disabled={editing}
                                autoFocus
                            />
                            <span className="field-hint">
                                Note: Changing document name will preserve the original file extension.
                            </span>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseEditModal}
                                disabled={editing}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="admin-btn-primary"
                                disabled={editing || !editForm.name.trim()}
                            >
                                <Edit2 size={15} />
                                {editing ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ============================================================= */}
            {/* Delete Confirmation Modal                                     */}
            {/* ============================================================= */}
            {documentToDelete && (
                <Modal
                    title="Delete Document"
                    onClose={handleCloseDeleteModal}
                >
                    <div className="admin-delete-modal">
                        {deleteError && (
                            <Alert
                                type="error"
                                message={deleteError}
                                onDismiss={() => setDeleteError("")}
                            />
                        )}

                        <div className="admin-delete-warning">
                            <AlertTriangle size={20} className="admin-delete-warning-icon" />
                            <div>
                                <strong>Warning: Permanent Destruction</strong>
                                <p>
                                    Deleting this document will permanently remove the record and all
                                    associated storage objects and versions from AWS S3. This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="admin-delete-target-badge">
                            <strong>{documentToDelete.name}</strong>
                            <span>
                                {documentToDelete.organization_name} • {documentToDelete.project_name} • {formatFileSize(documentToDelete.size)}
                            </span>
                        </div>

                        <p className="admin-delete-prompt">
                            Are you sure you want to permanently delete this document?
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseDeleteModal}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDeleteSubmit}
                                disabled={deleting}
                            >
                                <Trash2 size={15} />
                                {deleting ? "Deleting..." : "Permanently Delete"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
