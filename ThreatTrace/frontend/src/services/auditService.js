// frontend/src/services/auditService.js
import axios from "axios";

const BASE = "http://127.0.0.1:5000";
const AUDIT_API = `${BASE}/api/audit`;
const SCHED_API = `${BASE}/api/scheduler`;

export async function getAuditHistory() {
  const res = await axios.get(`${AUDIT_API}/history`);
  return res.data;
}

export async function getAuditReport(file_path) {
  const res = await axios.get(`${AUDIT_API}/report`, { params: { file_path } });
  return res.data;
}

export async function verifyByPath(log_path) {
  const res = await axios.post(`${AUDIT_API}/verify`, { log_path });
  return res.data;
}

export async function uploadAndVerify(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axios.post(`${AUDIT_API}/upload-scan`, fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
}

export async function downloadPDF(file_path) {
  const res = await axios.get(`${AUDIT_API}/download/pdf`, { params: { file_path }, responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit_report.pdf";
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function downloadCSV(file_path) {
  const res = await axios.get(`${AUDIT_API}/download/csv`, { params: { file_path }, responseType: "blob" });
  const blob = new Blob([res.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit_report.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

// Scheduler control
export async function schedulerStart(interval_seconds = 300) {
  const res = await axios.post(`${SCHED_API}/start`, { interval_seconds });
  return res.data;
}
export async function schedulerStop() {
  const res = await axios.post(`${SCHED_API}/stop`);
  return res.data;
}
export async function schedulerRunNow() {
  const res = await axios.post(`${SCHED_API}/run-now`);
  return res.data;
}
export async function schedulerStatus() {
  const res = await axios.get(`${SCHED_API}/status`);
  return res.data;
}
