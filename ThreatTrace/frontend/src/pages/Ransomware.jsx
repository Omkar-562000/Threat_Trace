// frontend/src/pages/Ransomware.jsx

import axios from "axios";
import { useEffect, useState } from "react";
import Toast from "../components/ui/Toast";
import socket from "../utils/socket";

export default function Ransomware() {
  const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
  const API = `${API_ROOT}/api/ransomware`;

  const [file, setFile] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState(null);

  /* ---------------------------------------------------------
     REAL-TIME ALERT LISTENER
  --------------------------------------------------------- */
  useEffect(() => {
    const handler = (msg) => {
      setToast({
        message: msg?.message || "Ransomware alert detected",
        severity: msg?.severity || "ransomware",
      });
      setTimeout(() => setToast(null), 4000);
    };

    socket.on("ransomware_alert", handler);
    socket.on("new_alert", handler);

    return () => {
      socket.off("ransomware_alert", handler);
      socket.off("new_alert", handler);
    };
  }, []);

  /* ---------------------------------------------------------
     FETCH EXISTING SCAN LOGS
  --------------------------------------------------------- */
  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/logs`);
      if (res.data.status === "success") {
        setScanLogs(res.data.logs);
      }
    } catch (e) {
      console.error("Failed to fetch logs:", e);
      setToast({ message: "Failed to fetch logs", severity: "error" });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  /* ---------------------------------------------------------
     FILE SELECT HANDLER
  --------------------------------------------------------- */
  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  };

  /* ---------------------------------------------------------
     UPLOAD & SCAN (Correct Backend Route)
  --------------------------------------------------------- */
  const handleScan = async () => {
    if (!file) {
      return setToast({ message: "Please select a file!", severity: "error" });
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === "success") {
        const result = res.data.result;

        const newEntry = {
          path: result.path,
          entropy: result.entropy,
          suspicious: result.suspicious,
          reason: result.reason?.join(", ") || "None",
          scan_time: new Date().toISOString(),
        };

        // Add to UI list
        setScanLogs((prev) => [newEntry, ...prev]);

        // Toast
        setToast({
          message: result.suspicious
            ? "⚠ Suspicious file detected!"
            : "File scanned successfully",
          severity: result.suspicious ? "ransomware" : "success",
        });
      } else {
        setToast({ message: res.data.message, severity: "error" });
      }
    } catch (error) {
      console.error("Scan failed:", error);
      setToast({ message: "Scan failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     UI / RENDER
  --------------------------------------------------------- */
  return (
    <div className="px-8 py-6 text-white">

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      {/* Title */}
      <h1 className="text-center text-4xl font-bold cyber-gradient-text mb-10">
        🛡 Ransomware Detection Module
      </h1>

      {/* Upload Card */}
      <div className="glass-cyber p-6 rounded-2xl shadow-xl border border-white/20 mb-10">
        <h2 className="text-xl font-bold text-cyan-300 mb-4">
          🔍 Upload File for Ransomware Scan
        </h2>

        <div className="flex items-center gap-4">
          <input type="file" onChange={handleFileSelect} className="cyber-input" />

          <button
            onClick={handleScan}
            disabled={loading}
            className="cyber-btn px-6 py-3 rounded-xl"
          >
            {loading ? "Scanning..." : "Upload & Scan"}
          </button>
        </div>
      </div>

      {/* SCAN LOG TABLE */}
      <div className="glass-cyber p-6 rounded-2xl border border-white/20">
        <h2 className="text-xl font-bold text-purple-300 mb-4">
          📄 Ransomware Scan Logs
        </h2>

        <table className="w-full text-white">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-3">File Path</th>
              <th className="p-3">Entropy</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {scanLogs.length === 0 && (
              <tr>
                <td className="p-3 text-gray-400" colSpan="5">
                  No scans performed yet.
                </td>
              </tr>
            )}

            {scanLogs.map((log, index) => (
              <tr
                key={index}
                className="border-b border-white/10 hover:bg-white/10 transition"
              >
                <td className="p-3">{log.path}</td>
                <td className="p-3">{log.entropy}</td>

                <td
                  className={`p-3 font-bold ${
                    log.suspicious ? "text-red-500" : "text-green-400"
                  }`}
                >
                  {log.suspicious ? "Suspicious" : "Clean"}
                </td>

                <td className="p-3">{log.reason}</td>
                <td className="p-3">
                  {log.scan_time
                    ? new Date(log.scan_time).toLocaleString()
                    : (log.timestamp || "-")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
