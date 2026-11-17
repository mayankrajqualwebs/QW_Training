import { useState } from "react";
import { Modal } from "../../../components/Modal";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { slugify } from "../../../utils/string";

export function CreateProjectModal({ onClose }) {
    const { createProject, loading, organizationId, selectedOrganization } = useWorkspace();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        if (!organizationId) return;
        try {
            await createProject({
                name: name.trim(),
                slug: slugify(slug || name),
            });
            onClose();
        } catch {
            // Error is handled in context
        }
    }

    return (
        <Modal title="Create Project" onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <label>Project Name</label>
                <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (!slug) setSlug(slugify(e.target.value));
                    }}
                    placeholder="Mobile Backend API"
                />
                <label>Project Slug</label>
                <input
                    required
                    minLength={2}
                    maxLength={50}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mobile-backend-api"
                />
                <p className="field-help">
                    Belongs to organization: <strong>{selectedOrganization?.name}</strong>
                </p>
                <button
                    className="primary-button full-width"
                    disabled={loading || !organizationId}
                >
                    Create Project
                </button>
            </form>
        </Modal>
    );
}

export default CreateProjectModal;

