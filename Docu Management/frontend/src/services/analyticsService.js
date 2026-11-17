// import { api } from "./api";

// // Analytics services
// export const analyticsService = {
//     async summary(organizationId, projectId, days = 7) {
//         const response = await api.get(
//             `/organizations/${organizationId}/projects/${projectId}/analytics/summary`,
//             {
//                 params: { days },
//             }
//         );

//         return response.data;
//     },
// };


import { get } from "./request";

// Analytics services
export const analyticsService = {
    summary(organizationId, projectId, days = 7) {
        return get(
            `/organizations/${organizationId}/projects/${projectId}/analytics/summary`,
            {
                params: { days },
            }
        );
    },
};
