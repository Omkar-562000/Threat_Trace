// frontend/src/pages/Audit.jsx
import { useCallback, useEffect, useState } from "react";
import {
  getAuditHistory,
  schedulerRunNow,
  schedulerStart,
  schedulerStatus,
  schedulerStop,
  uploadAndVerify,
  verifyByPath
} from "../services/auditService";

import Toast from "../components/ui/Toast";
import socket from "../utils/socket";
import "./Audit.css";

/* ================= RBAC ================= */
const hasRole = (allowed) => {
  const role = localStorage.getItem("role") || "personal";
  return allowed.includes(role);
};

export default function Audit() {
  const [toast, setToast] = useState(null);
  const [logPath, setLogPath] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const [schedRunning, setSchedRunning] = useState(false);
  const [schedInterval, setSchedInterval] = useState(300);

  const pushToast = (msg, severity = "info") => {
    setToast({ msg, severity });
    setTimeout(() => setToast(null), 4500);
  };

  const loadHistory = useCallback(async () => {
    const res = await getAuditHistory();
    if (res.status === "success") setHistory(res.history || []);
  }, []);

  const loadSchedulerStatus = useCallback(async () => {
    const res = await schedulerStatus();
    if (res.status === "success") {
      setSchedRunning(Boolean(res.scheduler?.running));
      setSchedInterval(res.scheduler?.interval_seconds || 300);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadSchedulerStatus();

    socket.on("tamper_alert", (payload) => {
      pushToast(`Tampering detected: ${payload.file_path}`, "tamper");
      loadHistory();
    });

    return () => socket.off("tamper_alert");
  }, [loadHistory, loadSchedulerStatus]);

  const handleVerifyPath = async () => {
    if (!logPath.trim()) return pushToast("Invalid file path", "error");
    setLoading(true);

    const res = await verifyByPath(logPath);
    setResult(res);

    pushToast(
      res.message || "Verification completed",
      res.tampered ? "tamper" : "success"
    );

    await loadHistory();
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file) return pushToast("Select a file", "error");
    setLoading(true);

    const res = await uploadAndVerify(file);
    setResult(res);

    pushToast(
      res.message || "Scan completed",
      res.tampered ? "tamper" : "success"
    );

    await loadHistory();
    setLoading(false);
  };

  const fmt = (d) => new Date(d).toLocaleString();

  return (
    <div className="p-6 text-white min-h-screen">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <h1 className="text-3xl font-bold text-cyberNeon mb-6">
        Audit Log Integrity
      </h1>

      {/* Verify & Upload */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-cyber p-4">
          <input
            className="cyber-input mb-3"
            placeholder="C:/logs/system.log"
            value={logPath}
            onChange={(e) => setLogPath(e.target.value)}
          />
          <button className="cyber-btn" onClick={handleVerifyPath}>
            Verify Path
          </button>
        </div>

        <div className="glass-cyber p-4">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button className="cyber-btn mt-2" onClick={handleUpload}>
            Upload & Scan
          </button>
        </div>
      </div>

      {/* Scheduler – CORPORATE ONLY */}
      {hasRole(["corporate"]) && (
        <div className="glass-cyber p-4 mt-6">
          <h3 className="font-semibold mb-2">Scheduler Controls</h3>

          <div className="flex items-center gap-3">
            <input
              type="number"
              className="cyber-input w-32"
              value={schedInterval}
              onChange={(e) => setSchedInterval(Number(e.target.value))}
            />

            <button className="cyber-btn" onClick={() => schedulerStart(schedInterval)}>
              Start
            </button>

            <button className="cyber-btn" onClick={schedulerStop}>
              Stop
            </button>

            <button className="cyber-btn" onClick={schedulerRunNow}>
              Run Now
            </button>

            <span className="text-sm">
              {schedRunning ? "Running" : "Stopped"}
            </span>
          </div>
        </div>
      )}

      {/* History */}
      <div className="glass-cyber p-4 mt-6">
        <h3 className="font-semibold mb-2">Audit History</h3>

        <ul className="space-y-1">
          {history.map((h, i) => (
            <li key={i}>
              {h.file_path} — {fmt(h.last_verified)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
