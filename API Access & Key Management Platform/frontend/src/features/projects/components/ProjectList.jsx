import { Copy } from "lucide-react";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { useClipboard } from "../../../hooks/useClipboard";
import { EmptyMessage } from "../../../components/EmptyMessage";

export function ProjectList() {
    const { projects, projectId, setProjectId, setPage, setNotice } = useWorkspace();
    const { copyToClipboard } = useClipboard();

    if (!projects.length) {
        return (
            <EmptyMessage message="No projects in this organization yet. Create one to begin managing API keys." />
        );
    }

    return (
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
                            <td>
                                <code>{project.slug}</code>
                            </td>
                            <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <code>{project.id}</code>
                                    <button
                                        className="icon-button"
                                        style={{ width: 24, height: 24 }}
                                        title="Copy Project ID"
                                        onClick={() =>
                                            copyToClipboard(project.id, "Project ID", setNotice)
                                        }
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
                                    {/* <button
                                        className="secondary-button compact"
                                        onClick={() => {
                                            setProjectId(project.id);
                                            setPage("Overview");
                                        }}
                                    >
                                        Select & Open
                                    </button> */}
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
    );
}

export default ProjectList;

