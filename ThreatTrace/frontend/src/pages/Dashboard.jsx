// frontend/src/pages/Dashboard.jsx

import axios from "axios";
import { useEffect, useState } from "react";
import Toast from "../components/ui/Toast";
import socket from "../utils/socket";

export default function Dashboard() {
  const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
  const API = `${API_ROOT}/api`;

  const [toast, setToast] = useState(null);

  const [logs, setLogs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const [auditPath, setAuditPath] = useState("");
  const [auditResult, setAuditResult] = useState(null);

  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  /* ======================================================
     SOCKET.IO — REAL-TIME ALERT LISTENERS
  ====================================================== */
  useEffect(() => {
    const onAlert = (msg) => {
      const message = msg?.message || "Security Alert ⚠️";
      setToast({
        message,
        severity: msg?.severity || "warning",
      });

      setTimeout(() => setToast(null), 3500);
    };

    socket.on("new_alert", onAlert);
    socket.on("tamper_alert", onAlert);
    socket.on("ransomware_alert", onAlert);

    return () => {
      socket.off("new_alert", onAlert);
      socket.off("tamper_alert", onAlert);
      socket.off("ransomware_alert", onAlert);
    };
  }, []);

  /* ======================================================
     FETCH RANSOMWARE LOGS
  ====================================================== */
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/ransomware/logs`);
      if (res.data.status === "success") {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Logs fetch error:", err);
    }
  };

  /* ======================================================
     FILE UPLOAD → RANSOMWARE SCAN
  ====================================================== */
  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadAndScan = async () => {
    if (!selectedFile) return alert("Please select a file first.");

    setLoadingScan(true);
    const form = new FormData();
    form.append("file", selectedFile);

    try {
      const res = await axios.post(`${API}/ransomware/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === "success") {
        setScanResult(res.data.result);
        fetchLogs();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Upload scan error:", err);
    }

    setLoadingScan(false);
  };

  /* ======================================================
     AUDIT LOG VERIFY BY SERVER PATH
  ====================================================== */
  const verifyAuditLog = async () => {
    if (!auditPath) return alert("Enter a file path to verify.");

    setLoadingAudit(true);

    try {
      const res = await axios.post(`${API}/audit/verify-path`, {
        log_path: auditPath,
      });

      if (res.data.status !== "error") {
        setAuditResult(res.data);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Audit verify error:", err);
      alert("Failed to verify audit log.");
    }

    setLoadingAudit(false);
  };

  return (
    <div className="min-h-screen bg-cyberDark text-white p-6 relative">

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      {/* Background FX */}
      <div className="absolute w-96 h-96 bg-cyberPurple/20 blur-3xl rounded-full top-20 left-10"></div>
      <div className="absolute w-80 h-80 bg-cyberNeon/20 blur-3xl rounded-full bottom-10 right-10"></div>

      {/* Page Title */}
      <h1 className="text-4xl font-Orbitron font-bold mb-10 text-center text-cyberPurple tracking-widest">
        ThreatTrace Dashboard
      </h1>

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* --------------------------------------------------
            RANSOMWARE SCAN BOX
        -------------------------------------------------- */}
        <div className="glass-cyber p-6 border border-white/20 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold text-cyberNeon mb-4">
            🔍 Upload File for Ransomware Scan
          </h2>

          <input
            type="file"
            onChange={handleFileSelect}
            className="cyber-input mb-4"
          />

          <button
            className="cyber-btn w-full"
            onClick={uploadAndScan}
            disabled={loadingScan}
          >
            {loadingScan ? "Scanning..." : "Upload & Scan"}
          </button>

          {scanResult && (
            <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 text-sm">
              <h3 className="font-bold text-cyberNeon">Scan Result</h3>
              <p><strong>File:</strong> {scanResult.path}</p>
              <p><strong>Entropy:</strong> {scanResult.entropy}</p>
              <p><strong>Suspicious:</strong> {scanResult.suspicious ? "YES" : "NO"}</p>
              <p><strong>Reason:</strong> {scanResult.reason?.join(", ") || "None"}</p>
            </div>
          )}
        </div>

        {/* --------------------------------------------------
            AUDIT INTEGRITY CHECKER
        -------------------------------------------------- */}
        <div className="glass-cyber p-6 border border-white/20 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold text-cyberNeon mb-4">
            📝 Audit Log Integrity Checker
          </h2>

          <input
            type="text"
            placeholder="Enter log file path (C:/logs/system.log)"
            value={auditPath}
            onChange={(e) => setAuditPath(e.target.value)}
            className="cyber-input mb-4"
          />

          <button
            className="cyber-btn w-full"
            onClick={verifyAuditLog}
            disabled={loadingAudit}
          >
            {loadingAudit ? "Verifying..." : "Verify Integrity"}
          </button>

          {auditResult && (
            <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 text-sm">
              <h3 className="font-bold text-cyberNeon mb-2">Audit Result</h3>

              <p><strong>Status:</strong> {auditResult.status}</p>
              <p><strong>Message:</strong> {auditResult.message}</p>
              <p><strong>Hash:</strong> {auditResult.last_hash || auditResult.hash}</p>
            </div>
          )}
        </div>

      </div>

      {/* --------------------------------------------------
          RANSOMWARE LOGS TABLE
      -------------------------------------------------- */}
      <div className="glass-cyber p-6 mt-10 border border-white/20 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-semibold text-cyberNeon mb-4">
          🛡️ Ransomware Scan Logs
        </h2>

        <table className="cyber-table w-full text-left">
          <thead>
            <tr className="bg-white/10 border border-white/20">
              <th className="p-3">File Path</th>
              <th className="p-3">Entropy</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition">
                <td className="p-3">{log.path}</td>
                <td className="p-3">{log.entropy}</td>
                <td className="p-3">
                  {log.suspicious ? (
                    <span className="text-red-400 font-bold">Suspicious</span>
                  ) : (
                    <span className="text-green-400 font-bold">Clean</span>
                  )}
                </td>
                <td className="p-3">{log.reason?.join(", ") || "None"}</td>
                <td className="p-3">{new Date(log.scan_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <p className="text-gray-400 mt-4">No logs found.</p>
        )}
      </div>
    </div>
  );
}
