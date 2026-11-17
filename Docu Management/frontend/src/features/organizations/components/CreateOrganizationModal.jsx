import { useState } from "react";
import { Modal } from "../../../components/Modal";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { slugify } from "../../../utils/string";

export function CreateOrganizationModal({ onClose }) {
    const { createOrganization, loading } = useWorkspace();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            await createOrganization({
                name: name.trim(),
                slug: slugify(slug || name),
            });
            onClose();
        } catch {
            // Error is handled in context
        }
    }

    return (
        <Modal title="Create Organization" onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <label>Organization Name</label>
                <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (!slug) setSlug(slugify(e.target.value));
                    }}
                    placeholder="Acme Engineering"
                />
                <label>Organization URL Slug</label>
                <input
                    required
                    minLength={2}
                    maxLength={50}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-engineering"
                />
                <p className="field-help">
                    Lowercase alphanumeric characters and single hyphens only.
                </p>
                <button className="primary-button full-width" disabled={loading}>
                    Create Organization
                </button>
            </form>
        </Modal>
    );
}

export default CreateOrganizationModal;

