
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, FileText, Download } from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { fileService } from "../services";
import { errorMessage } from "../utils/error";
import { EmptyMessage } from "../components/EmptyMessage";
import { FileUpload } from "../features/files/components/FileUpload";


export function FilesPage() {
    const { projectId, selectedProject } = useWorkspace();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [renamingFile, setRenamingFile] = useState(null);
    const [newFileName, setNewFileName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);

    const [deletingFile, setDeletingFile] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    const loadFiles = useCallback(async () => {
        if (!projectId) {
            setFiles([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await fileService.list(projectId);
            setFiles(data);
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void loadFiles();
    }, [loadFiles]);

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const filteredFiles = files.filter((file) => {
        const matchesSearch = file.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === "ALL" || file.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const downloadFile = async (file) => {
        try {
            setError("");

            const data = await fileService.getDownloadUrl(file.id);

            window.open(
                data.download_url,
                "_blank",
                "noopener,noreferrer"
            );
        } catch (error) {
            setError(errorMessage(error));
        }
    };

    const handleRename = async () => {
        if (!renamingFile || !newFileName.trim()) return;

        try {
            setRenameLoading(true);
            setError("");

            await fileService.rename(
                renamingFile.id,
                newFileName.trim()
            );

            setRenamingFile(null);
            setNewFileName("");

            await loadFiles();
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setRenameLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingFile) return;

        try {
            setDeleteLoading(true);
            setError("");

            await fileService.delete(deletingFile.id);

            setDeletingFile(null);

            await loadFiles();
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <section className="panel">
            <div className="panel-heading">
                {projectId && (
                    <FileUpload
                        projectId={projectId}
                        onUploadComplete={loadFiles}
                    />
                )}
                <div>
                    <h2>File Management</h2>
                    <p>
                        Manage documents in{" "}
                        {selectedProject?.name ?? "your selected project"}.
                    </p>
                </div>

                <button
                    className="secondary-button compact"
                    onClick={loadFiles}
                    disabled={!projectId || loading}
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            <div className="filter-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search files by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="filter-buttons">
                    {["ALL", "UPLOADED", "PENDING"].map((status) => (
                        <button
                            key={status}
                            className={
                                statusFilter === status
                                    ? "primary-button compact"
                                    : "secondary-button compact"
                            }
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === "ALL" ? "All Files" : status}
                        </button>
                    ))}
                </div>
            </div>

            {renamingFile && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Rename File</h3>

                        <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            placeholder="Enter new file name"
                        />

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() => {
                                    setRenamingFile(null);
                                    setNewFileName("");
                                }}
                                disabled={renameLoading}
                            >
                                Cancel
                            </button>

                            <button
                                className="primary-button"
                                onClick={handleRename}
                                disabled={renameLoading || !newFileName.trim()}
                            >
                                {renameLoading ? "Renaming..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deletingFile && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Delete File</h3>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{deletingFile.name}</strong>?
                        </p>

                        <p>
                            This action permanently removes the file from storage.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() => setDeletingFile(null)}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>

                            <button
                                className="primary-button"
                                onClick={handleDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Delete File"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!projectId ? (
                <EmptyMessage message="Select a project to manage its files." />
            ) : (
                <>
                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <p>Loading files...</p>
                    ) : filteredFiles.length === 0 ? (
                        <EmptyMessage
                            message={
                                searchQuery
                                    ? "No files match your search."
                                    : "No files uploaded to this project yet."
                            }
                        />
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>File Name</th>
                                        <th>Type</th>
                                        <th>Size</th>
                                        <th>Status</th>
                                        <th>Uploaded</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredFiles.map((file) => (
                                        <tr key={file.id}>
                                            <td>
                                                <strong>
                                                    <FileText
                                                        size={14}
                                                        style={{
                                                            verticalAlign: "middle",
                                                            marginRight: 6,
                                                        }}
                                                    />
                                                    {file.name}
                                                </strong>
                                            </td>

                                            <td>{file.contentType}</td>
                                            <td>{formatSize(Number(file.size))}</td>
                                            <td>
                                                <span className="badge badge-active">
                                                    {file.status}
                                                </span>
                                            </td>
                                            <td>
                                                {new Date(
                                                    file.createdAt
                                                ).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="secondary-button compact"
                                                        onClick={() => downloadFile(file)}
                                                        disabled={file.status !== "UPLOADED"}
                                                    >
                                                        <Download size={8} />
                                                        Download
                                                    </button>

                                                    <button
                                                        className="secondary-button compact"
                                                        onClick={() => {
                                                            setRenamingFile(file);
                                                            setNewFileName(file.name);
                                                        }}
                                                        disabled={file.status !== "UPLOADED"}
                                                    >
                                                        Rename
                                                    </button>

                                                    <button
                                                        className="secondary-button compact"
                                                        onClick={() => setDeletingFile(file)}
                                                        disabled={file.status !== "UPLOADED"}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

export default FilesPage;
