import { get, post, remove } from "./request";

// API key services
export const apiKeyService = {
    /**
     * Lists API keys belonging to a project (legacy workspace route).
     */
    list(organizationId, projectId) {
        return get(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`
        );
    },

    /**
     * Legacy create route (prohibited for regular users on backend).
     */
    create(organizationId, projectId, data) {
        return post(
            `/organizations/${organizationId}/projects/${projectId}/api-keys`,
            data
        );
    },

    /**
     * Legacy revoke route.
     */
    async revoke(organizationId, projectId, keyId) {
        await remove(
            `/organizations/${organizationId}/projects/${projectId}/api-keys/${keyId}`
        );
    },

    // -------------------------------------------------------------
    // User API Access Methods (Scoped to currently authenticated user)
    // -------------------------------------------------------------

    /**
     * Fetches all API keys assigned to the authenticated user.
     * @param {Object} [params] - Optional query filters (search, organization_id, project_id, status)
     * @returns {Promise<Array>} Array of UserApiKeyItem
     */
    getUserApiKeys(params = {}) {
        const query = new URLSearchParams();
        if (params.search) query.set("search", params.search);
        if (params.organization_id) query.set("organization_id", params.organization_id);
        if (params.project_id) query.set("project_id", params.project_id);
        if (params.status && params.status !== "all") query.set("status", params.status);

        const qs = query.toString();
        const url = `/user/api-keys${qs ? `?${qs}` : ""}`;
        return get(url);
    },

    /**
     * Retrieves full metadata and recent telemetry activity for an assigned key.
     * @param {string} apiKeyId
     * @returns {Promise<Object>} UserApiKeyDetailResponse
     */
    getUserApiKeyDetails(apiKeyId) {
        return get(`/user/api-keys/${apiKeyId}`);
    },

    /**
     * Executes one-time secure secret reveal for an assigned API key.
     * @param {string} apiKeyId
     * @returns {Promise<Object>} { id, name, api_key, expires_at, revealed_at }
     */
    revealApiKey(apiKeyId) {
        return post(`/user/api-keys/${apiKeyId}/reveal`, {});
    },

    /**
     * Revokes an assigned API key directly.
     * @param {string} apiKeyId
     * @returns {Promise<void>}
     */
    revokeUserApiKey(apiKeyId) {
        return remove(`/user/api-keys/${apiKeyId}`);
    },
};
