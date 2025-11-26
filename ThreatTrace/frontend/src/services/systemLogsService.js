// src/services/systemLogsService.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000/api/logs";

export async function getSystemLogs({ q = "", page = 1, per_page = 100 } = {}) {
  const params = { q, page, per_page };
  const res = await axios.get(`${API_BASE}/`, { params });
  return res.data;
}

export async function ingestLog(entry) {
  // entry: { message, level, source, timestamp? }
  const res = await axios.post(`${API_BASE}/ingest`, entry);
  return res.data;
}

export async function exportLogs(format = "csv", q = "") {
  const url = `${API_BASE}/export?format=${format}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  // For file download we use window.open for now, or fetch blob:
  const res = await axios.get(url, { responseType: "blob" });
  return res;
}

// Helper that triggers download of a blob
export async function downloadExport(format = "csv", q = "") {
  const res = await exportLogs(format, q);
  const blob = new Blob([res.data], { type: res.headers["content-type"] });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ext = format === "csv" ? "csv" : "pdf";
  a.href = url;
  a.download = `system_logs_export.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
