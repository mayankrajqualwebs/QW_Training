// import axios from "axios";
// import { BASE_URL } from "./api";

// // Health check services
// export const healthService = {
//     async check() {
//         const response = await axios.get(
//             `${BASE_URL}/health`,
//             {
//                 timeout: 5000,
//             }
//         );

//         return response.data;
//     },

//     async database() {
//         const response = await axios.get(
//             `${BASE_URL}/health/database`,
//             {
//                 timeout: 5000,
//             }
//         );

//         return response.data;
//     },
// };


import { get } from "./request";

// Health check services
export const healthService = {
    check() {
        return get("/health", {
            timeout: 5000,
        });
    },

    database() {
        return get("/health/database", {
            timeout: 5000,
        });
    },
};
