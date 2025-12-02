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
  /* ----------------------------------------
     STATE
  ---------------------------------------- */
  const [toast, setToast] = useState(null);

  const [logPath, setLogPath] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);

  // Scheduler state
  const [schedRunning, setSchedRunning] = useState(false);
  const [schedInterval, setSchedInterval] = useState(300);

  /* ----------------------------------------
     Toast helper
  ---------------------------------------- */
  const pushToast = (msg, severity = "info") => {
    setToast({ msg, severity });
    setTimeout(() => setToast(null), 4500);
  };

  /* ----------------------------------------
     Load history
  ---------------------------------------- */
  const loadHistory = useCallback(async () => {
    const res = await getAuditHistory();
    if (res.status === "success") {
      setHistory(res.history || []);
    }
  }, []);

  /* ----------------------------------------
     Load scheduler status
  ---------------------------------------- */
  const loadSchedulerStatus = useCallback(async () => {
    const res = await schedulerStatus();
    if (res.status === "success") {
      setSchedRunning(Boolean(res.scheduler?.running));
      setSchedInterval(res.scheduler?.interval_seconds || 300);
    }
  }, []);

  /* ----------------------------------------
     Socket: tamper_alert
  ---------------------------------------- */
  useEffect(() => {
    loadHistory();
    loadSchedulerStatus();

    socket.on("tamper_alert", (payload) => {
      pushToast(
        `⚠ Tampering detected: ${payload.file_path}`,
        "tamper"
      );
      loadHistory();
    });

    return () => {
      socket.off("tamper_alert");
    };
  }, [loadHistory, loadSchedulerStatus]);

  /* ----------------------------------------
     Verify path
  ---------------------------------------- */
  const handleVerifyPath = async () => {
    if (!logPath.trim())
      return pushToast("Enter a valid file path", "error");

    setLoading(true);
    setResult(null);

    const res = await verifyByPath(logPath);

    setResult(res);
    pushToast(
      res.message || "Verification complete",
      res.tampered ? "tamper" : "success"
    );

    await loadHistory();
    setLoading(false);
  };

  /* ----------------------------------------
     Upload & verify
  ---------------------------------------- */
  const handleUpload = async () => {
    if (!file) return pushToast("Choose a file first", "error");

    setLoading(true);
    setResult(null);

    const res = await uploadAndVerify(file);

    setResult(res);
    pushToast(
      res.message || "Scan completed",
      res.tampered ? "tamper" : "success"
    );

    await loadHistory();
    setFile(null);
    setLoading(false);
  };

  /* ----------------------------------------
     View report
  ---------------------------------------- */
  const viewReport = async (file_path) => {
    const res = await getAuditReport(file_path);

    if (res.status === "success") {
      setReport(res.report);
    } else {
      pushToast(res.message || "No report found", "error");
    }
  };

  /* ----------------------------------------
     Export handlers
  ---------------------------------------- */
  const exportPDFHandler = (fp) =>
    exportAuditPDF(fp).catch(() =>
      pushToast("PDF export failed", "error")
    );

  const exportCSVHandler = (fp) =>
    exportAuditCSV(fp).catch(() =>
      pushToast("CSV export failed", "error")
    );

  /* ----------------------------------------
     Scheduler handlers
  ---------------------------------------- */
  const handleStartScheduler = async () => {
    const res = await schedulerStart(schedInterval);
    pushToast(res.message, res.status === "success" ? "success" : "error");
    loadSchedulerStatus();
  };

  const handleStopScheduler = async () => {
    const res = await schedulerStop();
    pushToast(res.message, res.status === "success" ? "info" : "error");
    loadSchedulerStatus();
  };

  const handleRunNow = async () => {
    const res = await schedulerRunNow();
    pushToast(res.message, res.status === "success" ? "success" : "error");
    loadHistory();
  };

  /* ----------------------------------------
     Helpers
  ---------------------------------------- */
  const fmt = (d) => new Date(d).toLocaleString();

  const diffCls = (line) => {
    if (line.startsWith("+") && !line.startsWith("+++")) return "diff-line-add";
    if (line.startsWith("-") && !line.startsWith("---")) return "diff-line-del";
    if (line.startsWith("@@")) return "diff-line-meta";
    return "";
  };

  /* ----------------------------------------
     UI
  ---------------------------------------- */
  return (
    <div className="p-6 text-white min-h-screen">

      {toast && (
        <Toast
          message={toast.msg}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-3xl font-bold text-cyberNeon mb-6">
        Audit Log Integrity Checker
      </h1>

      {/* --------------------------
          ROW: Verify + Upload
      --------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Verify by Path */}
        <div className="glass-cyber p-4 rounded-xl border border-white/10">
          <h3 className="font-semibold mb-2">Verify by File Path</h3>

          <input
            className="cyber-input mb-3"
            placeholder="C:/logs/system.log"
            value={logPath}
            onChange={(e) => setLogPath(e.target.value)}
          />

          <button
            className="cyber-btn"
            disabled={loading}
            onClick={handleVerifyPath}
          >
            {loading ? "Verifying..." : "Verify Path"}
          </button>
        </div>

        {/* Upload */}
        <div className="glass-cyber p-4 rounded-xl border border-white/10">
          <h3 className="font-semibold mb-2">Upload & Verify File</h3>

          <input
            type="file"
            className="mb-3"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            className="cyber-btn"
            disabled={loading}
            onClick={handleUpload}
          >
            {loading ? "Scanning..." : "Upload & Scan"}
          </button>
        </div>
      </div>

      {/* --------------------------
          Scheduler Controls
      --------------------------- */}
      <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
        <h3 className="font-semibold mb-2">Scheduler Controls</h3>

        <div className="flex items-center gap-4">
          <input
            type="number"
            min={30}
            className="cyber-input w-32"
            value={schedInterval}
            onChange={(e) => setSchedInterval(Number(e.target.value))}
          />

          <button className="cyber-btn" onClick={handleStartScheduler}>
            Start
          </button>

          <button className="cyber-btn" onClick={handleStopScheduler}>
            Stop
          </button>

          <button className="cyber-btn" onClick={handleRunNow}>
            Run Now
          </button>

          <div className="ml-auto text-sm">
            Status:
            {schedRunning ? (
              <span className="text-green-400"> Running</span>
            ) : (
              <span className="text-red-400"> Stopped</span>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------
          Latest Result
      --------------------------- */}
      <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
        <h3 className="font-semibold mb-2">Latest Result</h3>

        {!result ? (
          <p className="text-gray-400">No recent scan.</p>
        ) : (
          <>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Message:</strong> {result.message}</p>
            <p><strong>Hash:</strong> <code>{result.last_hash}</code></p>

            {result.diff_summary && result.diff_summary.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold">Diff</h4>
                <pre className="diff-pre">
                  {result.diff_summary.map((line, idx) => (
                    <div key={idx} className={diffCls(line)}>
                      {line}
                    </div>
                  ))}
                </pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* --------------------------
          HISTORY TABLE
      --------------------------- */}
      <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
        <h3 className="font-semibold mb-2">Audit History</h3>

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
            {history.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-gray-400">
                  No audit records
                </td>
              </tr>
            )}

            {history.map((h, idx) => (
              <tr key={idx} className="border-t border-white/10">
                <td className="p-2">{h.file_path}</td>
                <td className="p-2">
                  <code>{String(h.last_hash).slice(0, 20)}...</code>
                </td>
                <td className="p-2">{fmt(h.last_verified)}</td>
                <td className="p-2">
                  {h.tampered ? (
                    <span className="text-red-400">Yes</span>
                  ) : (
                    <span className="text-green-400">No</span>
                  )}
                </td>

                <td className="p-2 flex gap-2">
                  <button className="cyber-btn px-3"
                    onClick={() => exportPDFHandler(h.file_path)}>
                    PDF
                  </button>

                  <button className="cyber-btn px-3"
                    onClick={() => exportCSVHandler(h.file_path)}>
                    CSV
                  </button>

                  <button className="cyber-btn px-3"
                    onClick={() => viewReport(h.file_path)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --------------------------
          REPORT PANEL
      --------------------------- */}
      {report && (
        <div className="glass-cyber p-4 rounded-xl border border-white/10 mt-6">
          <h3 className="font-semibold mb-2">
            Audit Report — {report.file_path}
          </h3>

          <p><strong>Last Verified:</strong> {fmt(report.last_verified)}</p>
          <p><strong>Last Hash:</strong> <code>{report.last_hash}</code></p>
          <p><strong>Tampered:</strong> {String(report.tampered)}</p>

          <div className="mt-3">
            <h4 className="font-semibold mb-1">History</h4>

            <ul className="space-y-1 mt-2">
              {report.history?.map((item, idx) => (
                <li key={idx}>
                  {fmt(item.timestamp_iso)} —{" "}
                  {item.tampered ? "Tampered" : "OK"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}