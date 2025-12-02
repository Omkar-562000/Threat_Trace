// frontend/src/services/auditService.js
// Clean, promise-based helper for Audit module (verify, upload, history, report, exports, scheduler)
// Matches backend routes: /api/audit/* and /api/scheduler/*

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const AUDIT_API = `${API_ROOT}/api/audit`;
const SCHED_API = `${API_ROOT}/api/scheduler`;

/* =========================
   Utilities
   ========================= */
async function handleJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Not JSON — return raw text
    return { status: res.ok ? "success" : "error", message: text };
  }
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/* =========================
   Verification & Upload
   ========================= */

/**
 * Verify a file by server path (server must be able to access the path).
 * POST { log_path }
 */
export async function verifyByPath(filePath) {
  const res = await fetch(`${AUDIT_API}/verify-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ log_path: filePath }),
  });

  if (res.ok) return handleJsonResponse(res);
  return handleJsonResponse(res);
}

/**
 * Upload a file and verify it on the server
 * Accepts a File object
 */
export async function uploadAndVerify(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${AUDIT_API}/upload-verify`, {
    method: "POST",
    body: form,
  });

  if (res.ok) return handleJsonResponse(res);
  return handleJsonResponse(res);
}

/* =========================
   History & Reports
   ========================= */

export async function getAuditHistory() {
  const res = await fetch(`${AUDIT_API}/history`, { method: "GET" });
  return handleJsonResponse(res);
}

export async function getAuditReport(file_path) {
  const url = `${AUDIT_API}/report?file_path=${encodeURIComponent(file_path)}`;
  const res = await fetch(url, { method: "GET" });
  return handleJsonResponse(res);
}

/* =========================
   Exports (CSV / PDF)
   ========================= */

export async function exportAuditCSV(file_path) {
  const url = `${AUDIT_API}/export/csv?file_path=${encodeURIComponent(file_path)}`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const err = await handleJsonResponse(res);
    throw new Error(err.message || "CSV export failed");
  }

  const blob = await res.blob();
  downloadBlob(blob, "audit_report.csv");
  return { status: "success" };
}

export async function exportAuditPDF(file_path) {
  const url = `${AUDIT_API}/export/pdf?file_path=${encodeURIComponent(file_path)}`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const err = await handleJsonResponse(res);
    throw new Error(err.message || "PDF export failed");
  }

  const blob = await res.blob();
  downloadBlob(blob, "audit_report.pdf");
  return { status: "success" };
}

/* =========================
   Scheduler Controls (optional)
   ========================= */

export async function schedulerStatus() {
  try {
    const res = await fetch(`${SCHED_API}/status`);
    return handleJsonResponse(res);
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

export async function schedulerStart(intervalSeconds = 300) {
  try {
    const res = await fetch(`${SCHED_API}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval_seconds: Number(intervalSeconds) }),
    });
    return handleJsonResponse(res);
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

export async function schedulerStop() {
  try {
    const res = await fetch(`${SCHED_API}/stop`, { method: "POST" });
    return handleJsonResponse(res);
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

export async function schedulerRunNow() {
  try {
    const res = await fetch(`${SCHED_API}/run-now`, { method: "POST" });
    return handleJsonResponse(res);
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

/* =========================
   Small convenience exports
   ========================= */

export default {
  verifyByPath,
  uploadAndVerify,
  getAuditHistory,
  getAuditReport,
  exportAuditCSV,
  exportAuditPDF,
  schedulerStatus,
  schedulerStart,
  schedulerStop,
  schedulerRunNow,
};
