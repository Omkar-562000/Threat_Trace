// frontend/src/pages/Audit.jsx

import { useCallback, useEffect, useState } from "react";
import {
  exportAuditCSV,
  exportAuditPDF,
  getAuditHistory,
  getAuditReport,
  schedulerRunNow,
  schedulerStart,
  schedulerStatus,
  schedulerStop,
  uploadAndVerify,
  verifyByPath,
} from "../services/auditService";

import Toast from "../components/ui/Toast";
import socket from "../utils/socket";
import "./Audit.css";

export default function Audit() {
  /* ------------------------------------------------------
     State
  ------------------------------------------------------ */
  const [logPath, setLogPath] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null); // Latest scan output
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);

  // Scheduler
  const [schedRunning, setSchedRunning] = useState(false);
  const [schedInterval, setSchedInterval] = useState(300);

  // Toast
  const [toast, setToast] = useState(null);

  const pushToast = (msg, severity = "info") => {
    setToast({ msg, severity });
    setTimeout(() => setToast(null), 4000);
  };

  /* ------------------------------------------------------
     Load Audit History
  ------------------------------------------------------ */
  const loadHistory = useCallback(async () => {
    const res = await getAuditHistory();
    if (res.status === "success") {
      setHistory(res.history || []);
    }
  }, []);

  /* ------------------------------------------------------
     Scheduler Status
  ------------------------------------------------------ */
  const refreshSchedulerStatus = useCallback(async () => {
    const res = await schedulerStatus();
    if (res.status === "success") {
      setSchedRunning(Boolean(res.scheduler?.running));
      setSchedInterval(res.scheduler?.interval_seconds || 300);
    }
  }, []);

  /* ------------------------------------------------------
     Socket.io Real-Time Tamper Alerts
  ------------------------------------------------------ */
  useEffect(() => {
    loadHistory();
    refreshSchedulerStatus();

    socket.on("tamper_alert", (payload) => {
      pushToast(
        `Tamper Detected → ${payload.file_path || "Unknown file"}`,
        "tamper"
      );
      loadHistory();
    });

    return () => {
      socket.off("tamper_alert");
    };
  }, [loadHistory, refreshSchedulerStatus]);

  /* ------------------------------------------------------
     Verify by Path
  ------------------------------------------------------ */
  const handleVerifyPath = async () => {
    if (!logPath.trim()) return pushToast("Enter a valid file path", "error");

    setLoading(true);
    setResult(null);

    const res = await verifyByPath(logPath);

    setResult(res);
    pushToast(res.message || "Verification done", res.tampered ? "tamper" : "success");

    await loadHistory();
    setLoading(false);
  };

  /* ------------------------------------------------------
     Upload & Verify
  ------------------------------------------------------ */
  const handleUpload = async () => {
    if (!file) return pushToast("Choose a file first", "error");

    setLoading(true);
    setResult(null);

    const res = await uploadAndVerify(file);

    setResult(res);
    pushToast(res.message || "Scan completed", res.tampered ? "tamper" : "success");

    await loadHistory();
    setFile(null);
    setLoading(false);
  };

  /* ------------------------------------------------------
     View Detailed Report
  ------------------------------------------------------ */
  const viewReport = async (path) => {
    const res = await getAuditReport(path);
    if (res.status === "success") setReport(res.report);
    else pushToast(res.message || "No report found", "error");
  };

  /* ------------------------------------------------------
     Export CSV / PDF
  ------------------------------------------------------ */
  const exportCSV = (fp) => exportAuditCSV(fp).catch(() => pushToast("CSV export failed", "error"));
  const exportPDF = (fp) => exportAuditPDF(fp).catch(() => pushToast("PDF export failed", "error"));

  /* ------------------------------------------------------
     Scheduler Buttons
  ------------------------------------------------------ */
  const startScheduler = async () => {
    const res = await schedulerStart(schedInterval);
    pushToast(res.message || "Scheduler Started", res.status === "success" ? "success" : "error");
    refreshSchedulerStatus();
  };

  const stopScheduler = async () => {
    const res = await schedulerStop();
    pushToast(res.message || "Scheduler Stopped", res.status === "success" ? "info" : "error");
    refreshSchedulerStatus();
  };

  const runNow = async () => {
    const res = await schedulerRunNow();
    pushToast(res.message || "Run started", res.status === "success" ? "success" : "error");
    loadHistory();
  };

  /* ------------------------------------------------------
     Helpers
  ------------------------------------------------------ */
  const fmt = (d) => new Date(d).toLocaleString();

  const diffClass = (line) => {
    if (line.startsWith("+") && !line.startsWith("+++")) return "diff-line-add";
    if (line.startsWith("-") && !line.startsWith("---")) return "diff-line-del";
    if (line.startsWith("@@")) return "diff-line-meta";
    return "";
  };

  /* ------------------------------------------------------
     UI
  ------------------------------------------------------ */
  return (
    <div className="p-6 text-white">
      {toast && (
        <Toast
          message={toast.msg}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className="text-2xl mb-4 text-cyberNeon">Audit Log Integrity Checker</h2>

      {/* --------------------------------------------------
          VERIFY SECTION
      -------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-6">
        {/* Verify via Path */}
        <div className="glass-cyber p-4 rounded-xl border border-white/10">
          <h3 className="font-bold mb-2">Verify by File Path</h3>

          <input
            className="cyber-input mb-3"
            placeholder="C:/logs/system.log"
            value={logPath}
            onChange={(e) => setLogPath(e.target.value)}
          />

          <button className="cyber-btn" disabled={loading} onClick={handleVerifyPath}>
            {loading ? "Verifying..." : "Verify Path"}
          </button>
        </div>

        {/* Upload + Scan */}
        <div className="glass-cyber p-4 rounded-xl border border-white/10">
          <h3 className="font-bold mb-2">Upload & Verify</h3>

          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-3" />

          <button className="cyber-btn" disabled={loading} onClick={handleUpload}>
            {loading ? "Scanning..." : "Upload & Scan"}
          </button>
        </div>
      </div>

      {/* --------------------------------------------------
          SCHEDULER CONTROLS
      -------------------------------------------------- */}
      <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
        <h3 className="font-bold mb-2">Scheduler Controls</h3>

        <div className="flex gap-4 items-center">
          <input
            type="number"
            min={30}
            value={schedInterval}
            onChange={(e) => setSchedInterval(Number(e.target.value))}
            className="cyber-input w-32"
          />

          <button className="cyber-btn" onClick={startScheduler}>Start</button>
          <button className="cyber-btn" onClick={stopScheduler}>Stop</button>
          <button className="cyber-btn" onClick={runNow}>Run Now</button>

          <div className="ml-auto text-sm">
            Status:{" "}
            {schedRunning ? (
              <span className="text-green-400">Running</span>
            ) : (
              <span className="text-red-400">Stopped</span>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------
          LATEST RESULT
      -------------------------------------------------- */}
      <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
        <h3 className="font-bold mb-2">Latest Result</h3>

        {!result ? (
          <p className="text-gray-400">No recent scan performed.</p>
        ) : (
          <>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Message:</strong> {result.message}</p>
            <p><strong>Hash:</strong> <code>{result.last_hash || result.hash}</code></p>

            {result.diff_summary && (
              <div className="mt-3">
                <h4 className="font-semibold mb-1">Diff Summary</h4>
                <pre className="diff-pre">
                  {result.diff_summary.map((line, idx) => (
                    <div key={idx} className={diffClass(line)}>
                      {line}
                    </div>
                  ))}
                </pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* --------------------------------------------------
          HISTORY TABLE
      -------------------------------------------------- */}
      <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
        <h3 className="font-bold mb-2">Audit History</h3>

        <table className="audit-table w-full text-left">
          <thead>
            <tr>
              <th className="p-2">File Path</th>
              <th className="p-2">Last Hash</th>
              <th className="p-2">Verified</th>
              <th className="p-2">Tampered</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-gray-400">
                  No audit records found.
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.file_path} className="border-t border-white/10">
                  <td className="p-2">{h.file_path}</td>
                  <td className="p-2"><code>{String(h.last_hash).slice(0, 20)}...</code></td>
                  <td className="p-2">{fmt(h.last_verified)}</td>
                  <td className="p-2">
                    {h.tampered ? (
                      <span className="text-red-400">Yes</span>
                    ) : (
                      <span className="text-green-400">No</span>
                    )}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button className="cyber-btn px-3" onClick={() => exportPDF(h.file_path)}>PDF</button>
                    <button className="cyber-btn px-3" onClick={() => exportCSV(h.file_path)}>CSV</button>
                    <button className="cyber-btn px-3" onClick={() => viewReport(h.file_path)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --------------------------------------------------
          REPORT PANEL
      -------------------------------------------------- */}
      {report && (
        <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
          <h3 className="font-bold mb-2">Audit Report for {report.file_path}</h3>

          <p><strong>Last Verified:</strong> {fmt(report.last_verified)}</p>
          <p><strong>Last Hash:</strong> <code>{report.last_hash}</code></p>
          <p><strong>Tampered:</strong> {String(report.tampered)}</p>

          <div className="mt-3">
            <h4 className="font-semibold">History</h4>
            <ul className="mt-2 space-y-1">
              {report.history?.map((h, idx) => (
                <li key={idx}>
                  {fmt(h.timestamp_iso)} — {h.tampered ? "Tampered" : "OK"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
