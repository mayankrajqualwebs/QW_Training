
import axios from "axios";
import { get, post, patch, remove } from "./request";

// File management services
export const fileService = {
    // Retrieve all files belonging to a project
    list(projectId) {
        return get(`/projects/${projectId}/files`);
    },

    // Retrieve individual file metadata
    getById(fileId) {
        return get(`/files/${fileId}`);
    },

    // Initiate file upload and generate S3 presigned URL
    initiateUpload(projectId, file) {
        return post(`/projects/${projectId}/files`, {
            name: file.name,
            content_type: file.type || "application/octet-stream",
            size: file.size,
        });
    },

    // Upload file directly to AWS S3
    uploadToS3(uploadUrl, file, contentType) {
        return axios.put(uploadUrl, file, {
            headers: {
                "Content-Type": contentType,
            },
        });
    },

    // Verify that the file was uploaded successfully
    verifyUpload(fileId) {
        return post(`/files/${fileId}/verify`);
    },

    // Generate a temporary S3 download URL
    getDownloadUrl(fileId) {
        return get(`/files/${fileId}/download`);
    },

    // Rename an uploaded file
    rename(fileId, newName) {
        return patch(`/files/${fileId}/rename`, {
            new_name: newName,
        });
    },

    // Delete a file
    delete(fileId) {
        return remove(`/files/${fileId}`);
    },
};
