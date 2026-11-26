
import { api } from "./api";

export const adminService = {
    async getOverview() {
        const response = await api.get("/admin/overview");
        return response.data;
    },

    async getActivity() {
        const response = await api.get("/admin/activity");
        return response.data;
    },

    async getUsers({
        search = "",
        platform_role = "",
        page = 1,
        page_size = 20,
    } = {}) {
        const response = await api.get("/admin/users", {
            params: {
                search: search || undefined,
                platform_role: platform_role || undefined,
                page,
                page_size,
            },
        });

        return response.data;
    },

    async updateUserRole(userId, platformRole) {
        const response = await api.patch(
            `/admin/users/${userId}/role`,
            { platform_role: platformRole }
        );

        return response.data;
    },

    async getProjects(params = {}) {
        const response = await api.get("/admin/projects", { params });
        return response.data;
    },

    async getOrganizations() {
        const response = await api.get("/admin/organizations");
        return response.data;
    },

    async getDocuments(params = {}) {
        const response = await api.get("/admin/documents", {
            params,
        });

        return response.data;
    },

    async getApiKeys(params = {}) {
        const response = await api.get("/admin/api-keys", {
            params,
        });

        return response.data;
    },

    async revokeApiKey(apiKeyId) {
        await api.delete(`/admin/api-keys/${apiKeyId}`);
    },


};
