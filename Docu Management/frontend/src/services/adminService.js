
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

    async createUser({ email, password, platform_role = "USER" }) {
        const response = await api.post("/admin/users", {
            email,
            password,
            platform_role,
        });

        return response.data;
    },

    async deleteUser(userId) {
        await api.delete(`/admin/users/${userId}`);
    },

    async getProjects(params = {}) {
        const response = await api.get("/admin/projects", {
            params,
        });

        return response.data;
    },

    async createProject({ organization_id, name, slug }) {
        const response = await api.post("/admin/projects", {
            organization_id,
            name,
            slug,
        });

        return response.data;
    },

    async deleteProject(projectId) {
        await api.delete(`/admin/projects/${projectId}`);
    },

    async getOrganizations() {
        const response = await api.get("/admin/organizations");
        return response.data;
    },

    async createOrganization({ name, slug }) {
        const response = await api.post("/admin/organizations", {
            name,
            slug,
        });

        return response.data;
    },

    async deleteOrganization(organizationId) {
        await api.delete(`/admin/organizations/${organizationId}`);
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

    // ---------------------------------------------------------
    // API Monitoring
    // ---------------------------------------------------------

    async getMonitoringSummary(days = 7) {
        const response = await api.get(
            "/admin/monitoring/summary",
            {
                params: { days },
            }
        );

        return response.data;
    },

    async getMonitoringRequests(params = {}) {
        const response = await api.get(
            "/admin/monitoring/requests",
            {
                params,
            }
        );

        return response.data;
    },
};
