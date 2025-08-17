import api from "./axios";

// --- Reporting API Functions ---

// POST to /api/reporting/ to request a new report
export const requestReport = async (reportType, params = {}) => {
    const { data } = await api.post('/reporting/', { type: reportType, params });
    return data;
};

// GET from /api/reporting/{jobId}/ to check a report's status
export const getReportStatus = async (jobId) => {
    const { data } = await api.get(`/reporting/${jobId}/`);
    return data;
};

// GET from /api/reporting/{jobId}/download/ to download the file
export const getReportDownloadUrl = (jobId) => {
    // This returns the URL string for the 'href' attribute, not an axios call
    // Note: We are using the full path because this will be used in an `<a>` tag.
    return `/api/reporting/${jobId}/download/`;
};
