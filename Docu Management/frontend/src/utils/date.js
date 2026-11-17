/**
 * Formats an ISO date string or timestamp into a localized readable date string.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function dateLabel(value) {
    if (!value) return "Never";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

