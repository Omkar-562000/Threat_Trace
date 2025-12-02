// frontend/src/services/auditService.js
const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

// Audit + Scheduler endpoints
const AUDIT_API = `${API_ROOT}/api/audit`;
const SCHED_API = `${API_ROOT}/api/scheduler`;

/* ------------------------------------------------------
   JSON response handler (safe for text / HTML errors)
------------------------------------------------------ */
async function parseResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: res.ok ? "success" : "error", message: text };
  }
}

/* ------------------------------------------------------
   FILE PATH VERIFICATION (audit_routes.py /verify-path)
------------------------------------------------------ */
export async function verifyByPath(filePath) {
  const res = await fetch(`${AUDIT_API}/verify-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ log_path: filePath }),
  });
  return parseResponse(res);
}

/* ------------------------------------------------------
   UPLOAD + VERIFY FILE (audit_routes.py /upload-verify)
------------------------------------------------------ */
export async function uploadAndVerify(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${AUDIT_API}/upload-verify`, {
    method: "POST",
    body: form,
  });
  return parseResponse(res);
}

/* ------------------------------------------------------
   FETCH AUDIT HISTORY (audit_routes.py /history)
------------------------------------------------------ */
export async function getAuditHistory() {
  const res = await fetch(`${AUDIT_API}/history`);
  return parseResponse(res);
}

/* ------------------------------------------------------
   VIEW REPORT FOR A SPECIFIC FILE (audit_routes.py /report)
------------------------------------------------------ */
export async function getAuditReport(file_path) {
  const res = await fetch(
    `${AUDIT_API}/report?file_path=${encodeURIComponent(file_path)}`
  );
  return parseResponse(res);
}

/* ------------------------------------------------------
   EXPORT CSV
------------------------------------------------------ */
export async function exportAuditCSV(file_path) {
  const res = await fetch(
    `${AUDIT_API}/export/csv?file_path=${encodeURIComponent(file_path)}`
  );

  if (!res.ok) throw new Error("CSV export failed");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "audit_report.csv";
  a.click();
  window.URL.revokeObjectURL(url);

  return { status: "success" };
}

/* ------------------------------------------------------
   EXPORT PDF
------------------------------------------------------ */
export async function exportAuditPDF(file_path) {
  const res = await fetch(
    `${AUDIT_API}/export/pdf?file_path=${encodeURIComponent(file_path)}`
  );

  if (!res.ok) throw new Error("PDF export failed");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "audit_report.pdf";
  a.click();
  window.URL.revokeObjectURL(url);

  return { status: "success" };
}

/* ------------------------------------------------------
   SCHEDULER STATUS (scheduler_routes.py /status)
------------------------------------------------------ */
export async function schedulerStatus() {
  const res = await fetch(`${SCHED_API}/status`);
  return parseResponse(res);
}

/* ------------------------------------------------------
   START SCHEDULER (scheduler_routes.py /start)
------------------------------------------------------ */
export async function schedulerStart(intervalSeconds = 300) {
  const res = await fetch(`${SCHED_API}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interval_seconds: intervalSeconds }),
  });
  return parseResponse(res);
}

/* ------------------------------------------------------
   STOP SCHEDULER (scheduler_routes.py /stop)
------------------------------------------------------ */
export async function schedulerStop() {
  const res = await fetch(`${SCHED_API}/stop`, { method: "POST" });
  return parseResponse(res);
}

/* ------------------------------------------------------
   RUN IMMEDIATE CHECK (scheduler_routes.py /run-now)
------------------------------------------------------ */
export async function schedulerRunNow() {
  const res = await fetch(`${SCHED_API}/run-now`, { method: "POST" });
  return parseResponse(res);
}

/* ------------------------------------------------------
   Export default service
------------------------------------------------------ */
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