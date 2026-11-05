import axios from "axios";

export const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

export const authApi = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

let accessToken = localStorage.getItem("access_token");
let refreshToken = localStorage.getItem("refresh_token");
let refreshPromise = null;

// Save authentication tokens
export function saveTokens(access, refresh) {
    accessToken = access;
    refreshToken = refresh;

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
}

// Clear authentication tokens
export function clearTokens() {
    accessToken = null;
    refreshToken = null;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

// Check whether a session exists
export function hasSession() {
    return Boolean(accessToken || localStorage.getItem("access_token"));
}

export function getRefreshToken() {
    return refreshToken || localStorage.getItem("refresh_token");
}

// Request interceptor
api.interceptors.request.use((config) => {
    const token = accessToken || localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const original = error.config;

        if (
            error.response?.status !== 401 ||
            !original ||
            original._retried ||
            original.url?.includes("/auth/login") ||
            original.url?.includes("/auth/refresh")
        ) {
            return Promise.reject(error);
        }

        const currentRefresh =
            refreshToken || localStorage.getItem("refresh_token");

        if (!currentRefresh) {
            clearTokens();
            window.dispatchEvent(new Event("session-expired"));

            return Promise.reject(error);
        }

        original._retried = true;

        try {
            if (!refreshPromise) {
                refreshPromise = authApi
                    .post("/auth/refresh", {
                        refresh_token: currentRefresh,
                    })
                    .then((response) => {
                        const data = response.data;

                        saveTokens(
                            data.access_token,
                            data.refresh_token
                        );

                        return data.access_token;
                    })
                    .catch(() => {
                        clearTokens();
                        window.dispatchEvent(
                            new Event("session-expired")
                        );

                        return null;
                    })
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            const newAccessToken = await refreshPromise;

            if (!newAccessToken) {
                return Promise.reject(error);
            }

            original.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(original);
        } catch {
            clearTokens();
            window.dispatchEvent(new Event("session-expired"));

            return Promise.reject(error);
        }
    }
);

