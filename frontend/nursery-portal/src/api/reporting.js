// mohamedmalwa1/lu-mino/Lu-mino-eef071840a5399afd97f3e5772965c80cf5a7740/frontend/nursery-portal/src/api/reporting.js
import api from "./axios";

// CORRECTED PATH
const BASE = "/reporting";

// List recent report jobs
export async function listReports() {
  const res = await api.get(`${BASE}/`);
  return res.data;
}

// Request a new report
export async function requestReport(reportType, parameters = {}) {
  const res = await api.post(`${BASE}/create/`, { report_type: reportType, parameters });
  return res.data;
}

// Get a single job status
export async function getReportStatus(jobId) {
  const res = await api.get(`${BASE}/${jobId}/`);
  return res.data;
}

// Build a direct URL (only useful if endpoint is public; we keep for UI linking)
export function getReportDownloadUrl(jobId) {
  const base = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/+$/, "") : "";
  return `${base}${BASE}/${jobId}/download/`;
}

// Authenticated download (fixes 401 from <a href>)
export async function downloadReport(jobId) {
  const res = await api.get(`${BASE}/${jobId}/download/`, { responseType: "blob" });
  let filename = "report.pdf";
  const dispo = res.headers?.["content-disposition"];
  if (dispo) {
    const m = /filename\*?=(?:UTF-8''|\")?([^;\"']+)/i.exec(dispo);
    if (m && m[1]) {
      filename = decodeURIComponent(m[1]);
    }
  }
  return { data: res.data, filename };
}
