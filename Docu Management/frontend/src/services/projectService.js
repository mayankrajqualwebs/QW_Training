// import { api } from "./api";

// // Project services
// export const projectService = {
//     async list(organizationId) {
//         const response = await api.get(
//             `/organizations/${organizationId}/projects`
//         );

//         return response.data;
//     },

//     async create(organizationId, data) {
//         const response = await api.post(
//             `/organizations/${organizationId}/projects`,
//             data
//         );

//         return response.data;
//     },
// };


import { get, post } from "./request";

// Project services
export const projectService = {
    list(organizationId) {
        return get(
            `/organizations/${organizationId}/projects`
        );
    },

    create(organizationId, data) {
        return post(
            `/organizations/${organizationId}/projects`,
            data
        );
    },
};
