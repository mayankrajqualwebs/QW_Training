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
};
