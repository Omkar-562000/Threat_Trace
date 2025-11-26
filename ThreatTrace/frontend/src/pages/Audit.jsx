// frontend/src/pages/Audit.jsx
import { useEffect, useState } from "react";
import {
  getAuditHistory,
  getAuditReport,
  schedulerRunNow,
  schedulerStart,
  schedulerStatus,
  schedulerStop,
  uploadAndVerify,
  verifyByPath
} from "../services/auditService";

export default function Audit() {
  const [logPath, setLogPath] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  // Scheduler states
  const [schedRunning, setSchedRunning] = useState(false);
  const [schedInterval, setSchedInterval] = useState(300);

  useEffect(() => {
    loadHistory();
    refreshSchedulerStatus();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getAuditHistory();
      if (res.status === "success") setHistory(res.history || []);
    } catch (e) {
      console.error("History load error", e);
    }
  };

  const handleVerifyPath = async (e) => {
    e.preventDefault();
    if (!logPath) return alert("Enter path");
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyByPath(logPath);
      setResult(res);
      await loadHistory();
    } catch (err) {
      console.error(err);
      alert("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (ev) => {
    setFile(ev.target.files[0]);
  };

  const handleUploadScan = async () => {
    if (!file) return alert("Choose file");
    setLoading(true);
    setResult(null);
    try {
      const res = await uploadAndVerify(file);
      setResult(res);
      await loadHistory();
    } catch (err) {
      console.error(err);
      alert("Upload/scan error");
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (file_path) => {
    try {
      const res = await getAuditReport(file_path);
      if (res.status === "success") setReport(res.report);
      else alert(res.message || "No report");
    } catch (err) {
      console.error(err);
      alert("Report error");
    }
  };

  // Scheduler control helpers
  const refreshSchedulerStatus = async () => {
    try {
      const res = await schedulerStatus();
      if (res.status === "success") {
        setSchedRunning(res.scheduler.running);
        setSchedInterval(res.scheduler.interval_seconds || 300);
      }
    } catch (e) {
      console.error("sched status", e);
    }
  };

  const startScheduler = async () => {
    try {
      await schedulerStart(schedInterval);
      await refreshSchedulerStatus();
      alert("Scheduler started");
    } catch (e) {
      console.error(e);
      alert("Failed to start scheduler");
    }
  };

  const stopScheduler = async () => {
    try {
      await schedulerStop();
      await refreshSchedulerStatus();
      alert("Scheduler stopped");
    } catch (e) {
      console.error(e);
      alert("Failed to stop scheduler");
    }
  };

  const runNow = async () => {
    try {
      await schedulerRunNow();
      await loadHistory();
      alert("Run executed");
    } catch (e) {
      console.error(e);
      alert("Run failed");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Audit Log Integrity Checker</h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="cyber-card p-4">
          <h3 className="font-bold mb-2">Verify by server file path</h3>
          <input
            type="text"
            placeholder="E:/ThreatTrace/system.log"
            value={logPath}
            onChange={(e) => setLogPath(e.target.value)}
            className="cyber-input mb-3"
          />
          <button className="cyber-btn" onClick={handleVerifyPath} disabled={loading}>
            {loading ? "Verifying..." : "Verify Path"}
          </button>
        </div>

        <div className="cyber-card p-4">
          <h3 className="font-bold mb-2">Upload & Verify</h3>
          <input type="file" onChange={handleFileSelect} className="mb-3" />
          <button className="cyber-btn" onClick={handleUploadScan} disabled={loading}>
            {loading ? "Scanning..." : "Upload & Scan"}
          </button>
        </div>
      </div>

      {/* Scheduler Controls */}
      <div className="mt-4 cyber-card p-4">
        <h3 className="font-bold mb-2">Scheduler Controls</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={schedInterval}
            onChange={(e) => setSchedInterval(Number(e.target.value))}
            className="cyber-input w-40"
          />
          <button className="cyber-btn" onClick={startScheduler}>Start</button>
          <button className="cyber-btn" onClick={stopScheduler}>Stop</button>
          <button className="cyber-btn" onClick={runNow}>Run Now</button>
          <div className="ml-auto text-sm">
            Status: {schedRunning ? <span className="text-green-400">Running</span> : <span className="text-red-400">Stopped</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 cyber-card p-4">
        <h3 className="font-bold mb-2">Latest Result</h3>
        {result ? (
          <div>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Message:</strong> {result.message}</p>
            <p><strong>Hash:</strong> <code>{result.hash}</code></p>

            {result.diff && result.diff.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold">Diff (unified)</h4>
                <pre style={{maxHeight: 300, overflow: 'auto', background: '#0b1020', padding: 12}}>
                  {result.diff.map((line, idx) => {
                    let style = {};
                    if (line.startsWith("+") && !line.startsWith("+++")) style = { color: "#6ee7b7" };
                    if (line.startsWith("-") && !line.startsWith("---")) style = { color: "#fb7185" };
                    if (line.startsWith("@@")) style = { color: "#60a5fa" };
                    return <div key={idx} style={style}>{line}</div>;
                  })}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">No recent scan performed.</p>
        )}
      </div>

      <div className="mt-6 cyber-card p-4">
        <h3 className="font-bold mb-2">Audit History</h3>
        <table className="w-full text-left audit-table">
          <thead>
            <tr>
              <th>File Path</th>
              <th>Last Hash</th>
              <th>Verified</th>
              <th>Tampered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.file_path}>
                <td style={{width:'50%'}}>{h.file_path}</td>
                <td style={{width:'20%'}}><code>{h.last_hash?.slice(0,20)}...</code></td>
                <td style={{width:'15%'}}>{new Date(h.last_verified).toLocaleString()}</td>
                <td style={{width:'10%'}}>{h.tampered ? <span style={{color:'#fb7185'}}>Yes</span> : <span style={{color:'#34d399'}}>No</span>}</td>
                <td style={{width:'5%'}}>
                  <td style={{ width: "15%" }}>
                <div className="flex items-center gap-2">
                  <button className="cyber-btn px-2 py-1">PDF</button>
                  <button className="cyber-btn px-2 py-1">CSV</button>
                  <button className="cyber-btn px-2 py-1" onClick={() => viewReport(h.file_path)}>View</button>
                </div>
                  </td>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={5} className="text-gray-400">No audit records</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {report && (
        <div className="mt-6 cyber-card p-4">
          <h3 className="font-bold">Audit Report for {report.file_path}</h3>
          <p><strong>Last verified:</strong> {new Date(report.last_verified).toLocaleString()}</p>
          <p><strong>Last hash:</strong> <code>{report.last_hash}</code></p>
          <p><strong>Tampered:</strong> {report.tampered ? "Yes" : "No"}</p>

          <div className="mt-3">
            <h4 className="font-semibold">History</h4>
            <ul>
              {report.history && report.history.map((h, idx) => (
                <li key={idx}>
                  {new Date(h.timestamp).toLocaleString()} — {h.tampered ? "Tampered" : "OK"} {h.diff_sample_lines ? ` — diff lines: ${h.diff_sample_lines.length}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
