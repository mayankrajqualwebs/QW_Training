import { api } from "./api";

// Analytics services
export const analyticsService = {
    async summary(organizationId, projectId, days = 7) {
        const response = await api.get(
            `/organizations/${organizationId}/projects/${projectId}/analytics/summary`,
            {
                params: { days },
            }
        );

        return response.data;
    },
};

