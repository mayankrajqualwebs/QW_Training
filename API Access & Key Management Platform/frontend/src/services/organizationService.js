import { api } from "./api";

// Organization services
export const organizationService = {
    async list() {
        const response = await api.get("/organizations");

        return response.data;
    },

    async create(data) {
        const response = await api.post("/organizations", data);

        return response.data;
    },
};

