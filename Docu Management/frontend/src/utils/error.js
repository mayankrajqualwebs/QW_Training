import axios from "axios";

/**
 * Extracts a user-friendly error message from Axios errors or standard Errors.
 * @param {unknown} error
 * @returns {string}
 */
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

