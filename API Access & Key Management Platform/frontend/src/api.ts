
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

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
let refreshPromise: Promise<string | null> | null = null;

export function saveTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

export function hasSession() {
    return Boolean(accessToken || localStorage.getItem("access_token"));
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = accessToken || localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as
            | (InternalAxiosRequestConfig & { _retried?: boolean })
            | undefined;

        if (
            error.response?.status !== 401 ||
            !original ||
            original._retried ||
            original.url?.includes("/auth/login") ||
            original.url?.includes("/auth/refresh")
        ) {
            return Promise.reject(error);
        }

        const currentRefresh = refreshToken || localStorage.getItem("refresh_token");
        if (!currentRefresh) {
            clearTokens();
            window.dispatchEvent(new Event("session-expired"));
            return Promise.reject(error);
        }

        original._retried = true;

        try {
            if (!refreshPromise) {
                refreshPromise = authApi
                    .post("/auth/refresh", { refresh_token: currentRefresh })
                    .then((response) => {
                        const data = response.data as TokenResponse;
                        saveTokens(data.access_token, data.refresh_token);
                        return data.access_token;
                    })
                    .catch(() => {
                        clearTokens();
                        window.dispatchEvent(new Event("session-expired"));
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
    },
);

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface User {
    id: string;
    email: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    role: string;
}

export interface Project {
    id: string;
    name: string;
    slug: string;
    organization_id: string;
}

export interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    scopes: string[];
    expires_at: string | null;
    last_used_at: string | null;
    revoked_at: string | null;
    created_at: string;
}

export interface CreatedApiKey extends ApiKey {
    api_key: string;
}

export interface UsageSummary {
    project_id: string;
    period_days: number;
    total_requests: number;
    successful_requests: number;
    error_requests: number;
    average_latency_ms: number;
    error_rate_percent: number;
    status_code_breakdown: Record<string, number>;
}

export interface OrganizationCreate {
    name: string;
    slug: string;
}

export interface ProjectCreate {
    name: string;
    slug: string;
}

export interface ApiKeyCreate {
    name: string;
    scopes: string[];
    expires_at: string | null;
}

export const authService = {
    async register(email: string, password: string) {
        const response = await api.post<User>("/auth/register", {
            email,
            password,
        });
        return response.data;
    },

    async login(email: string, password: string) {
        const form = new URLSearchParams();
        form.set("username", email);
        form.set("password", password);

        const response = await authApi.post<TokenResponse>(
            "/auth/login",
            form,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
        );

        saveTokens(response.data.access_token, response.data.refresh_token);
        return response.data;
    },

    async me() {
        const response = await api.get<User>("/auth/me");
        return response.data;
    },

    async logout() {
        const token = refreshToken;
        try {
            if (token) {
                await api.post("/auth/logout", { refresh_token: token });
            }
        } finally {
            clearTokens();
        }
    },
};

export const organizationService = {
    async list() {
        const response = await api.get<Organization[]>("/organizations");
        return response.data;
    },

    async create(data: OrganizationCreate) {
        const response = await api.post<Organization>("/organizations", data);
        return response.data;
    },
};

export const projectService = {
    async list(organizationId: string) {
        const response = await api.get<Project[]>(
            `/organizations/${organizationId}/projects`,
        );
        return response.data;
    },

    async create(organizationId: string, data: ProjectCreate) {
        const response = await api.post<Project>(
            `/organizations/${organizationId}/projects`,
            data,
        );
        return response.data;
    },
};

export const apiKeyService = {
    async list(organizationId: string, projectId: string) {
        const response = await api.get<ApiKey[]>(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`,
        );
        return response.data;
    },

    async create(
        organizationId: string,
        projectId: string,
        data: ApiKeyCreate,
    ) {
        const response = await api.post<CreatedApiKey>(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`,
            data,
        );
        return response.data;
    },

    async revoke(organizationId: string, projectId: string, keyId: string) {
        await api.delete(
            `/organizations/${organizationId}/projects/${projectId}/api-keys/${keyId}`,
        );
    },
};

export const analyticsService = {
    async summary(
        organizationId: string,
        projectId: string,
        days = 7,
    ) {
        const response = await api.get<UsageSummary>(
            `/organizations/${organizationId}/projects/${projectId}/analytics/summary`,
            { params: { days } },
        );
        return response.data;
    },
};

export const healthService = {
    async check() {
        const response = await axios.get<{ status: string; service: string }>(
            `${BASE_URL}/health`,
            { timeout: 5000 },
        );
        return response.data;
    },
    async database() {
        const response = await axios.get<{ status: string; database: string }>(
            `${BASE_URL}/health/database`,
            { timeout: 5000 },
        );
        return response.data;
    },
};

export interface TestApiResponse {
    status: number;
    statusText: string;
    data: unknown;
    latencyMs: number;
    ok: boolean;
}

export const protectedApiService = {
    async test(projectId: string, apiKey: string): Promise<TestApiResponse> {
        const start = performance.now();
        try {
            const response = await axios.get(
                `${BASE_URL}/v1/projects/${projectId}/data`,
                {
                    headers: { "X-API-Key": apiKey },
                    timeout: 15000,
                },
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

export function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        if (typeof detail === "string") return detail;
        if (detail && typeof detail === "object") {
            return JSON.stringify(detail);
        }
        if (!error.response) {
            return "Cannot reach the API server. Check that FastAPI is running.";
        }
        return error.message;
    }

    return error instanceof Error ? error.message : "Something went wrong.";
}
