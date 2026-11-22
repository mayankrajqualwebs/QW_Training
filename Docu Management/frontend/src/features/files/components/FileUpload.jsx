
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { fileService } from "../../../services";
import { errorMessage } from "../../../utils/error";

export function FileUpload({ projectId, onUploadComplete }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleUpload = async () => {
        if (!projectId || !selectedFile) return;

        setUploading(true);
        setError("");
        setSuccess("");

        let uploadedToS3 = false;

        try {
            // Step 1: Initiate upload through FastAPI
            const uploadData = await fileService.initiateUpload(
                projectId,
                selectedFile
            );

            // Step 2: Upload directly to AWS S3
            await fileService.uploadToS3(
                uploadData.upload_url,
                selectedFile,
                selectedFile.type || "application/octet-stream"
            );

            uploadedToS3 = true;

            // Step 3: Verify upload through FastAPI
            await fileService.verifyUpload(uploadData.file_id);

            setSuccess("File uploaded and verified successfully!");
            setSelectedFile(null);

            // Refresh the file list
            if (onUploadComplete) {
                await onUploadComplete();
            }
        } catch (e) {
            const message = errorMessage(e);

            setError(
                uploadedToS3
                    ? `File reached S3, but verification or refresh failed: ${message}`
                    : message
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-upload">
            <input
                type="file"
                disabled={!projectId || uploading}
                onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] || null);
                    setError("");
                    setSuccess("");
                }}
            />

            {selectedFile && (
                <p>
                    Selected: <strong>{selectedFile.name}</strong>
                </p>
            )}

            <button
                className="primary-button"
                onClick={handleUpload}
                disabled={!projectId || !selectedFile || uploading}
            >
                <UploadCloud size={16} />
                {uploading ? "Uploading..." : "Upload File"}
            </button>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}
        </div>
    );
}

export default FileUpload;
