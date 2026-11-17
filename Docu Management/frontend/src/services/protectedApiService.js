
// import axios from "axios";
// import { BASE_URL } from "./api";

// // Protected API testing service
// export const protectedApiService = {
//     async test(projectId, apiKey) {
//         const start = performance.now();

//         try {
//             const response = await axios.get(
//                 `${BASE_URL}/api-test/projects/${projectId}/data`,
//                 {
//                     headers: {
//                         "X-API-Key": apiKey,
//                     },
//                     timeout: 15000,
//                 }
//             );

//             return {
//                 status: response.status,
//                 statusText: response.statusText || "OK",
//                 data: response.data,
//                 latencyMs: Math.round(performance.now() - start),
//                 ok: true,
//             };

//         } catch (err) {
//             const latencyMs = Math.round(performance.now() - start);

//             if (axios.isAxiosError(err) && err.response) {
//                 return {
//                     status: err.response.status,
//                     statusText: err.response.statusText || "Error",
//                     data: err.response.data,
//                     latencyMs,
//                     ok: false,
//                 };
//             }

//             throw err;
//         }
//     },
// };


import axios from "axios";
import { authApi } from "./api";

// Protected API testing service
export const protectedApiService = {
    async test(projectId, apiKey) {
        const start = performance.now();

        try {
            const response = await authApi.get(
                `/api-test/projects/${projectId}/data`,
                {
                    headers: {
                        "X-API-Key": apiKey,
                    },
                    timeout: 15000,
                }
            );

            return {
                status: response.status,
                statusText: response.statusText || "OK",
                data: response.data,
                latencyMs: Math.round(performance.now() - start),
                ok: true,
            };

        } catch (err) {
            const latencyMs = Math.round(performance.now() - start);

            if (axios.isAxiosError(err) && err.response) {
                return {
                    status: err.response.status,
                    statusText: err.response.statusText || "Error",
                    data: err.response.data,
                    latencyMs,
                    ok: false,
                };
            }

            throw err;
        }
    },
};
