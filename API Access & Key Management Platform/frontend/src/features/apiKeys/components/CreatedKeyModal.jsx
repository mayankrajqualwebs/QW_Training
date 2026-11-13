import { Copy, Terminal, Check } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { useClipboard } from "../../../hooks/useClipboard";

export function CreatedKeyModal({ createdKey, onClose }) {
    const { setTestingKey, setPage, setNotice, triggerScrollToTester } = useWorkspace();
    const { copyToClipboard } = useClipboard();

    if (!createdKey) return null;

    return (
        <Modal title="API Key Generated Successfully" onClose={onClose}>
            <div className="alert alert-warning">
                This secret key is only displayed once. Please copy and store it safely in your environment variables.
            </div>
            <p className="created-key-name">
                <strong>Name:</strong> {createdKey.name}
            </p>
            <div className="secret-box">
                <code>{createdKey.api_key}</code>
                <button
                    className="secondary-button compact"
                    onClick={() =>
                        copyToClipboard(createdKey.api_key, "Secret Key", setNotice)
                    }
                >
                    <Copy size={15} /> Copy
                </button>
            </div>
            <p className="field-help">Scopes: {createdKey.scopes.join(", ")}</p>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                    className="secondary-button"
                    style={{ flex: 1 }}
                    onClick={() => {
                        setTestingKey(createdKey.api_key);
                        onClose();
                        setPage("Overview");
                        triggerScrollToTester?.();
                        setNotice("API key loaded into Interactive Test Console.");
                    }}
                >
                    <Terminal size={15} /> Test Key Now
                </button>
                <button
                    className="primary-button"
                    style={{ flex: 1 }}
                    onClick={onClose}
                >
                    <Check size={16} /> Done
                </button>
            </div>
        </Modal>
    );
}

export default CreatedKeyModal;

