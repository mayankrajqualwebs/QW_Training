import axios from "axios";

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

const authApi = axios.create({
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

// Authentication services
export const authService = {
    async register(email, password) {
        const response = await api.post("/auth/register", {
            email,
            password,
        });

        return response.data;
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

    async me() {
        const response = await api.get("/auth/me");

        return response.data;
    },

    async logout() {
        const token = refreshToken;

        try {
            if (token) {
                await api.post("/auth/logout", {
                    refresh_token: token,
                });
            }
        } finally {
            clearTokens();
        }
    },
};

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

// Project services
export const projectService = {
    async list(organizationId) {
        const response = await api.get(
            `/organizations/${organizationId}/projects`
        );

        return response.data;
    },

    async create(organizationId, data) {
        const response = await api.post(
            `/organizations/${organizationId}/projects`,
            data
        );

        return response.data;
    },
};

// API key services
export const apiKeyService = {
    async list(organizationId, projectId) {
        const response = await api.get(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`
        );

        return response.data;
    },

    async create(organizationId, projectId, data) {
        const response = await api.post(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`,
            data
        );

        return response.data;
    },

    async revoke(organizationId, projectId, keyId) {
        await api.delete(
            `/organizations/${organizationId}/projects/${projectId}/api-keys/${keyId}`
        );
    },
};

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

// Health check services
export const healthService = {
    async check() {
        const response = await axios.get(
            `${BASE_URL}/health`,
            {
                timeout: 5000,
            }
        );

        return response.data;
    },

    async database() {
        const response = await axios.get(
            `${BASE_URL}/health/database`,
            {
                timeout: 5000,
            }
        );

        return response.data;
    },
};

// Protected API testing service
export const protectedApiService = {
    async test(projectId, apiKey) {
        const start = performance.now();

        try {
            const response = await axios.get(
                `${BASE_URL}/v1/projects/${projectId}/data`,
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

// Error handling utility
export function errorMessage(error) {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        if (typeof detail === "string") {
            return detail;
        }

        if (detail && typeof detail === "object") {
            return JSON.stringify(detail);
        }

        if (!error.response) {
            return "Cannot reach the API server. Check that FastAPI is running.";
        }

        return error.message;
    }

    return error instanceof Error
        ? error.message
        : "Something went wrong.";
}
