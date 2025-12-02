// frontend/src/services/systemLogsService.js
// Clean API service matching backend/routes/logs_routes.py

import axios from "axios";

// ----------------------------------------------------------
// Base API URL
// ----------------------------------------------------------
const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const LOGS_API = `${API_ROOT}/api/logs`;


// ----------------------------------------------------------
// 1) Fetch Logs (supports: q, level, source, date range, pagination)
// ----------------------------------------------------------
export async function getSystemLogs({
  q = "",
  level = "ALL",
  source = "",
  dateFrom = "",
  dateTo = "",
  page = 1,
  per_page = 100
} = {}) {

  const params = {
    q,
    level,
    source,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    per_page
  };

  const res = await axios.get(`${LOGS_API}/`, { params });
  return res.data;
}


// ----------------------------------------------------------
// 2) Fetch dynamic log levels (INFO, WARNING, ERROR, CRITICAL)
// ----------------------------------------------------------
export async function getLogLevels() {
  try {
    const res = await axios.get(`${LOGS_API}/levels`);
    return res.data; // {status:'success', levels:[...] }
  } catch {
    return {
      status: "error",
      levels: ["INFO", "WARNING", "ERROR", "CRITICAL"]
    };
  }
}


// ----------------------------------------------------------
// 3) Export logs (CSV or PDF)
// ----------------------------------------------------------
export async function exportLogs(format = "csv", filters = {}) {
  const params = new URLSearchParams({
    format,
    ...filters
  }).toString();

  const url = `${LOGS_API}/export?${params}`;

  return axios.get(url, { responseType: "blob" });
}


// ----------------------------------------------------------
// 4) Trigger download
// ----------------------------------------------------------
export async function downloadExport(format = "csv", filters = {}) {
  const response = await exportLogs(format, filters);

  const blob = new Blob([response.data], {
    type: response.headers["content-type"]
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `system_logs_export.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}


// ----------------------------------------------------------
// Default export
// ----------------------------------------------------------
export default {
  getSystemLogs,
  getLogLevels,
  exportLogs,
  downloadExport
};
