import { ShieldCheck } from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";

export function SelectionBar() {
    const {
        selectedOrganization,
        organizationId,
        projects,
        projectId,
        setProjectId,
    } = useWorkspace();

    return (
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
                        <option key={project.id} value={project.id}>
                            {project.name} ({project.slug})
                        </option>
                    ))}
                </select>
            </div>
            <div className="selection-role">
                <ShieldCheck size={17} />
                Role: {selectedOrganization?.role ?? "None"}
            </div>
        </section>
    );
}

export default SelectionBar;

