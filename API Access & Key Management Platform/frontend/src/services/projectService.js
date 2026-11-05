import { api } from "./api";

// Project services
export const projectService = {
    async list(organizationId) {
        const response = await api.get(
            `/organizations/${organizationId}/projects`
        );

        return response.data;
    },

    async create(organizationId, data) {
        const response = await api.post(
            `/organizations/${organizationId}/projects`,
            data
        );

        return response.data;
    },
};

