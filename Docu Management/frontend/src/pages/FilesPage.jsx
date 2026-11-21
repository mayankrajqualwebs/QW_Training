
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { fileService } from "../services";
import { errorMessage } from "../utils/error";
import { EmptyMessage } from "../components/EmptyMessage";

export function FilesPage() {
    const { projectId, selectedProject } = useWorkspace();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    return (
        <section className="panel">
            <div className="panel-heading">
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
                    ) : files.length === 0 ? (
                        <EmptyMessage message="No files uploaded to this project yet." />
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
                                    </tr>
                                </thead>

                                <tbody>
                                    {files.map((file) => (
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
