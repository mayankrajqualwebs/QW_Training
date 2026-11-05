import { useState, useCallback } from "react";

export function useClipboard(timeout = 2500) {
    const [copiedText, setCopiedText] = useState(null);

    const copyToClipboard = useCallback(
        (text, label, onNotice) => {
            void navigator.clipboard.writeText(text);
            setCopiedText(label);
            if (onNotice) {
                onNotice(`Copied ${label} to clipboard.`);
            }
            setTimeout(() => setCopiedText(null), timeout);
        },
        [timeout]
    );

    return { copiedText, copyToClipboard };
}

export default useClipboard;

