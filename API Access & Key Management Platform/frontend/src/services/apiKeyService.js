import { api } from "./api";

// API key services
export const apiKeyService = {
    async list(organizationId, projectId) {
        const response = await api.get(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`
        );

        return response.data;
    },

    async create(organizationId, projectId, data) {
        const response = await api.post(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`,
            data
        );

        return response.data;
    },

    async revoke(organizationId, projectId, keyId) {
        await api.delete(
            `/organizations/${organizationId}/projects/${projectId}/api-keys/${keyId}`
        );
    },
};

