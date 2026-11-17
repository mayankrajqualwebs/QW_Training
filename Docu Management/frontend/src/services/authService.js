// import { api, authApi, saveTokens, clearTokens, getRefreshToken } from "./api";

// // Authentication services
// export const authService = {
//     async register(email, password) {
//         const response = await api.post("/auth/register", {
//             email,
//             password,
//         });

//         return response.data;
//     },

//     async login(email, password) {
//         const form = new URLSearchParams();

//         form.set("username", email);
//         form.set("password", password);

//         const response = await authApi.post(
//             "/auth/login",
//             form,
//             {
//                 headers: {
//                     "Content-Type": "application/x-www-form-urlencoded",
//                 },
//             }
//         );

//         saveTokens(
//             response.data.access_token,
//             response.data.refresh_token
//         );

//         return response.data;
//     },

//     async me() {
//         const response = await api.get("/auth/me");

//         return response.data;
//     },

//     async logout() {
//         const token = getRefreshToken();

//         try {
//             if (token) {
//                 await api.post("/auth/logout", {
//                     refresh_token: token,
//                 });
//             }
//         } finally {
//             clearTokens();
//         }
//     },
// };


import {
    authApi,
    saveTokens,
    clearTokens,
    getRefreshToken,
} from "./api";

import { get, post } from "./request";

// Authentication services
export const authService = {
    register(email, password) {
        return post("/auth/register", {
            email,
            password,
        });
    },

    async login(email, password) {
        const form = new URLSearchParams();

        form.set("username", email);
        form.set("password", password);

        const response = await authApi.post(
            "/auth/login",
            form,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        saveTokens(
            response.data.access_token,
            response.data.refresh_token
        );

        return response.data;
    },

    me() {
        return get("/auth/me");
    },

    async logout() {
        const token = getRefreshToken();

        try {
            if (token) {
                await post("/auth/logout", {
                    refresh_token: token,
                });
            }
        } finally {
            clearTokens();
        }
    },
};
