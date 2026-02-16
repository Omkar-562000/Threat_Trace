// frontend/src/services/systemLogsService.js
// ThreatTrace — System Logs API Client (Final Polished Build)

import axios from "axios";
import axiosInstance from "../utils/axiosConfig";

// ----------------------------------------------------------
// Base URL
// ----------------------------------------------------------
const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const LOGS_API = `${API_ROOT}/api/logs`;

// ----------------------------------------------------------
// Helper: safe JSON parser fallback
// ----------------------------------------------------------
function safeJsonParse(response) {
  try {
    return response.data;
  } catch {
    return {
      status: "error",
      message: "Invalid response format from backend",
      raw: response,
    };
  }
}

// ----------------------------------------------------------
// 1️⃣ FETCH LOGS
// Supports filters: q, level, source, date range, pagination
// ----------------------------------------------------------
export async function getSystemLogs({
  q = "",
  level = "ALL",
  source = "",
  dateFrom = "",
  dateTo = "",
  page = 1,
  per_page = 100,
} = {}) {
  const params = {
    q,
    level,
    source,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    per_page,
  };

  try {
    const res = await axios.get(`${LOGS_API}/`, { params });
    return safeJsonParse(res);
  } catch (error) {
    console.error("❌ getSystemLogs error:", error);
    return {
      status: "error",
      message: "Failed to fetch system logs",
      error: String(error),
    };
  }
}

// ----------------------------------------------------------
// 2️⃣ GET DISTINCT LOG LEVELS
// ----------------------------------------------------------
export async function getLogLevels() {
  try {
    const res = await axios.get(`${LOGS_API}/levels`);
    return safeJsonParse(res);
  } catch (e) {
    return {
      status: "error",
      levels: ["INFO", "WARNING", "ERROR", "CRITICAL"],
    };
  }
}

// ----------------------------------------------------------
// 3️⃣ EXPORT LOGS (CSV/PDF)
// ----------------------------------------------------------
export async function exportLogs(format = "csv", filters = {}) {
  const params = new URLSearchParams({ format, ...filters }).toString();
  const url = `${LOGS_API}/export?${params}`;

  try {
    return await axiosInstance.get(url, { responseType: "blob" });
  } catch (error) {
    console.error("❌ exportLogs error:", error);
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      "Failed to export logs";
    throw new Error(backendMessage);
  }
}

// ----------------------------------------------------------
// 4️⃣ DIRECT DOWNLOAD UTILITY
// ----------------------------------------------------------
export async function downloadExport(format = "csv", filters = {}) {
  const response = await exportLogs(format, filters);

  const blob = new Blob([response.data], {
    type: response.headers["content-type"],
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `system_logs_export.${format}`;
  a.click();

  window.URL.revokeObjectURL(url);
}

// ----------------------------------------------------------
// Default Export
// ----------------------------------------------------------
export default {
  getSystemLogs,
  getLogLevels,
  exportLogs,
  downloadExport,
};
