import { Plus } from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { ProjectList } from "../features/projects/components/ProjectList";

export function ProjectsPage() {
    const {
        selectedOrganization,
        organizationId,
        setShowProjectForm,
    } = useWorkspace();

    return (
        <section className="panel">
            <div className="panel-heading">
                <div>
                    <h2>Projects</h2>
                    <p>
                        Projects configured in{" "}
                        {selectedOrganization?.name ?? "your organization"}
                    </p>
                </div>
                <button
                    className="primary-button compact"
                    disabled={!organizationId}
                    onClick={() => setShowProjectForm(true)}
                >
                    <Plus size={15} /> New Project
                </button>
            </div>

            <ProjectList />
        </section>
    );
}

export default ProjectsPage;

