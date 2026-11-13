
import { api } from "./api";

// Common GET request
export const get = async (url, config = {}) => {
    const response = await api.get(url, config);
    return response.data;
};

// Common POST request
export const post = async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
};

// Common PUT request
export const put = async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
};

// Common PATCH request
export const patch = async (url, data = {}, config = {}) => {
    const response = await api.patch(url, data, config);
    return response.data;
};

// Common DELETE request
export const remove = async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
};
