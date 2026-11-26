
import { Copy, Terminal, Check } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { useClipboard } from "../../../hooks/useClipboard";
import { useNavigate } from "react-router-dom";

export function CreatedKeyModal({ createdKey, onClose }) {
    const {
        setTestingKey,
        setNotice,
        triggerScrollToTester,
    } = useWorkspace();

    const { copyToClipboard } = useClipboard();
    const navigate = useNavigate();

    if (!createdKey) return null;

    const handleTestKey = () => {
        // Use the actual secret, not the database ID.
        setTestingKey(createdKey.api_key);

        onClose();
        navigate("/workspace/overview");

        triggerScrollToTester?.();

        setNotice(
            `API key "${createdKey.name}" loaded into the tester.`
        );
    };

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
                        copyToClipboard(
                            createdKey.api_key,
                            "Secret Key",
                            setNotice
                        )
                    }
                >
                    <Copy size={15} /> Copy
                </button>
            </div>

            <p className="field-help">
                Scopes: {createdKey.scopes.join(", ")}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                    className="secondary-button"
                    style={{ flex: 1 }}
                    onClick={handleTestKey}
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
