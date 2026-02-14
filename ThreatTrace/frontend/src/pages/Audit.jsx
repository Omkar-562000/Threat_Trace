// frontend/src/pages/Audit.jsx
import { useCallback, useEffect, useState } from "react";
import {
  exportAuditCSV,
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

      {/* Scheduler – TECHNICAL ONLY */}
      {hasRole(["technical"]) ? (
        <div className="glass-cyber p-4 mt-6">
          <h3 className="font-semibold mb-3">🔧 Scheduler Controls (Technical)</h3>
          
          {/* Status Badge */}
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              schedRunning 
                ? "bg-green-600 text-white" 
                : "bg-gray-600 text-white"
            }`}>
              {schedRunning ? "⚡ Running" : "⏸️ Stopped"}
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="text-sm text-gray-400">Interval (seconds):</label>
            <input
              type="number"
              className="cyber-input w-32"
              value={schedInterval}
              onChange={(e) => setSchedInterval(Number(e.target.value))}
              min="60"
            />

            <button 
              className="cyber-btn bg-green-600 hover:bg-green-700 disabled:opacity-50"
              disabled={schedRunning}
              onClick={async () => {
                try {
                  await schedulerStart(schedInterval);
                  pushToast("Scheduler started", "success");
                  await loadSchedulerStatus();
                } catch (err) {
                  pushToast(err.response?.data?.message || "Failed to start scheduler", "error");
                }
              }}
            >
              ▶ Start
            </button>

            <button 
              className="cyber-btn bg-red-600 hover:bg-red-700 disabled:opacity-50"
              disabled={!schedRunning}
              onClick={async () => {
                try {
                  await schedulerStop();
                  pushToast("Scheduler stopped", "success");
                  await loadSchedulerStatus();
                } catch (err) {
                  pushToast(err.response?.data?.message || "Failed to stop scheduler", "error");
                }
              }}
            >
              ⏹ Stop
            </button>

            <button 
              className="cyber-btn bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                try {
                  await schedulerRunNow();
                  pushToast("Manual scan triggered", "success");
                  await loadHistory();
                } catch (err) {
                  pushToast(err.response?.data?.message || "Failed to run scan", "error");
                }
              }}
            >
              ⚡ Run Now
            </button>
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-400 space-y-1">
            <p><strong>▶ Start:</strong> Begin automated scans at specified interval</p>
            <p><strong>⏹ Stop:</strong> Halt automated scanning</p>
            <p><strong>⚡ Run Now:</strong> Trigger immediate scan (independent of schedule)</p>
          </div>
        </div>
      ) : (
        <div className="glass-cyber p-4 mt-6 border-2 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔒</span>
            <div>
              <h3 className="font-semibold text-yellow-400">Scheduler Controls Locked</h3>
              <p className="text-sm text-gray-400 mt-1">
                Upgrade to <span className="text-cyberPurple font-semibold">Technical</span> plan to access automated scheduled scans
              </p>
            </div>
          </div>
          
          {/* Help Text for Non-Technical Users */}
          <div className="mt-4 text-sm text-gray-400 space-y-2">
            <p><strong>What is the Scheduler?</strong></p>
            <p>The scheduler automatically scans registered files at regular intervals to detect tampering, eliminating the need for manual verification.</p>
            <p><strong>Benefits:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Continuous monitoring 24/7</li>
              <li>Instant alerts on file modifications</li>
              <li>Automatic audit history updates</li>
              <li>Customizable scan intervals</li>
            </ul>
          </div>
        </div>
      )}

      {/* History */}
      <div className="glass-cyber p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Audit History</h3>
          
          {hasRole(["corporate", "technical"]) && history.length > 0 && (
            <button
              className="cyber-btn text-sm px-3 py-1"
              onClick={async () => {
                try {
                  await exportAuditCSV(history[0].file_path);
                  pushToast("CSV export successful", "success");
                } catch (err) {
                  pushToast("Export failed", "error");
                }
              }}
            >
              📥 Export Latest CSV
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {history.length === 0 ? (
            <li className="text-gray-400 text-sm">No audit history yet</li>
          ) : (
            history.map((h, i) => (
              <li key={i} className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10">
                <div>
                  <span className="text-cyberBlue">{h.file_path}</span>
                  <span className="text-gray-400 text-sm ml-3">— {fmt(h.last_verified)}</span>
                </div>
                {h.tampered && (
                  <span className="text-red-400 text-xs font-semibold px-2 py-1 bg-red-500/20 rounded">
                    ⚠️ TAMPERED
                  </span>
                )}
              </li>
            ))
          )}
        </ul>

        {!hasRole(["corporate", "technical"]) && history.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
            <p className="text-yellow-400 font-semibold">🔒 Export Feature Locked</p>
            <p className="text-gray-400 mt-1">
              Upgrade to <span className="text-cyberPurple font-semibold">Corporate</span> or{" "}
              <span className="text-cyberPurple font-semibold">Technical</span> to export audit reports
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
