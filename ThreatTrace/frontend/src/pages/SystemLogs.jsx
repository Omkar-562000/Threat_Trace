// frontend/src/pages/SystemLogs.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TimelineChart from "../components/TimelineChart"; // keep if available, else remove
import Toast from "../components/ui/Toast";
import {
  downloadExport,
  getLogLevels,
  getSystemLogs,
} from "../services/systemLogsService";
import socket from "../utils/socket";
import { hasRole } from "../utils/role";

export default function SystemLogs() {
  const [searchParams] = useSearchParams();
  /* ===============================
     States
  =============================== */
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [timelineData, setTimelineData] = useState([]);

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("ALL");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [levels, setLevels] = useState([]);

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 50;

  // auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  // incoming logs buffer (to avoid re-render storm)
  const logBuffer = useRef([]);
  const bufferTimeout = useRef(null);

  /* ===============================
     SOCKET — Real-time Logs
  =============================== */
  const handleSocketLog = useCallback(
    (newLog) => {
      if (!autoRefresh) return;

      // Normalize incoming event shape (defensive)
      const normalized = {
        timestamp: newLog.timestamp || new Date().toISOString(),
        level: newLog.level || "INFO",
        source: newLog.source || "system",
        message: newLog.message || String(newLog.msg || ""),
      };

      logBuffer.current.push(normalized);

      if (!bufferTimeout.current) {
        bufferTimeout.current = setTimeout(() => {
          setLogs((prev) => {
            // prepend new logs so recent appear first
            const merged = [...logBuffer.current, ...prev];
            // keep reasonable cap (e.g., 5000) to avoid memory blowup
            return merged.slice(0, 5000);
          });

          setToast({ message: "New system logs received", severity: "info" });
          // update timeline incrementally
          setTimelineData((prev) => tickTimeline(prev, logBuffer.current));

          // reset buffer
          logBuffer.current = [];
          bufferTimeout.current = null;
        }, 800);
      }
    },
    [autoRefresh]
  );

  useEffect(() => {
    socket.on("system_log", handleSocketLog);

    return () => {
      socket.off("system_log", handleSocketLog);
      if (bufferTimeout.current) {
        clearTimeout(bufferTimeout.current);
        bufferTimeout.current = null;
      }
    };
  }, [handleSocketLog]);

  /* ===============================
     Fetch initial logs + levels
  =============================== */
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSystemLogs({ page: 1, per_page: 500 });
      if (res && res.status === "success") {
        setLogs(res.logs || []);
        computeTimeline(res.logs || []);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
      setToast({ message: "Failed to load logs", severity: "error" });
    }
    setLoading(false);
  }, []);

  const fetchLevels = useCallback(async () => {
    const res = await getLogLevels();
    if (res && res.status === "success") setLevels(res.levels || []);
    else if (res && res.levels) setLevels(res.levels);
  }, []);

  useEffect(() => {
    fetchInitial();
    fetchLevels();
  }, [fetchInitial, fetchLevels]);

  // Allow global navbar search to prefill System Logs filters via query params.
  useEffect(() => {
    const qpQ = searchParams.get("q") || "";
    const qpLevel = searchParams.get("level") || "";
    const qpSource = searchParams.get("source") || "";

    if (qpQ) setQ(qpQ);
    if (qpLevel) setLevel(qpLevel);
    if (qpSource) setSource(qpSource);
  }, [searchParams]);

  /* ===============================
     Filtering
  =============================== */
  const applyFilters = useCallback(() => {
    let out = [...logs];

    const query = q.trim().toLowerCase();

    if (query) {
      out = out.filter(
        (l) =>
          (l.message || "").toLowerCase().includes(query) ||
          (l.source || "").toLowerCase().includes(query) ||
          (l.level || "").toLowerCase().includes(query)
      );
    }

    if (level && level !== "ALL") {
      out = out.filter((l) => (l.level || "") === level);
    }

    if (source.trim()) {
      out = out.filter((l) =>
        (l.source || "").toLowerCase().includes(source.toLowerCase())
      );
    }

    if (dateFrom) {
      const fromTS = new Date(dateFrom).getTime();
      out = out.filter((l) => new Date(l.timestamp).getTime() >= fromTS);
    }

    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      out = out.filter((l) => new Date(l.timestamp).getTime() <= d.getTime());
    }

    setFiltered(out);
    setPage(1);
  }, [logs, q, level, source, dateFrom, dateTo]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  /* ===============================
     Timeline helpers
  =============================== */
  const computeTimeline = useCallback((items) => {
    const bucketMap = {};
    (items || []).forEach((l) => {
      try {
        const minute = new Date(l.timestamp).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        bucketMap[minute] = (bucketMap[minute] || 0) + 1;
      } catch {
        // ignore bad timestamp
      }
    });

    const result = Object.keys(bucketMap)
      .sort()
      .map((k) => ({ time: k, count: bucketMap[k] }));

    setTimelineData(result);
  }, []);

  const tickTimeline = (prev, newLogs) => {
    const map = { ...Object.fromEntries((prev || []).map((p) => [p.time, p.count])) };

    (newLogs || []).forEach((l) => {
      try {
        const bucket = new Date(l.timestamp).toISOString().slice(0, 16);
        map[bucket] = (map[bucket] || 0) + 1;
      } catch {
        // ignore
      }
    });

    const sorted = Object.keys(map)
      .sort()
      .map((k) => ({ time: k, count: map[k] }));

    // keep last N buckets
    return sorted.slice(-120);
  };

  /* ===============================
     Pagination
  =============================== */
  const paginated = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  /* ===============================
     Exports
  =============================== */
  const exportCSV = () => {
    downloadExport("csv", { q, level, source });
    setToast({ message: "CSV export started", severity: "info" });
  };

  const exportPDF = () => {
    downloadExport("pdf", { q, level, source });
    setToast({ message: "PDF export started", severity: "info" });
  };

  /* ===============================
     UI Helpers
  =============================== */
  const fmt = (ts) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  /* ===============================
     Render
  =============================== */
  return (
    <div className="p-6 text-white flex gap-6 min-h-screen">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      {/* LEFT FILTER PANEL */}
      <aside className="w-80 glass-cyber p-4 rounded-xl flex-shrink-0 border border-white/10">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>

        <div className="mb-4">
          <label className="text-sm text-gray-300">Search</label>
          <input
            className="cyber-input mt-1"
            placeholder="Search message, source..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-300">Level</label>
          <select
            className="cyber-input mt-1"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="ALL">All</option>
            {levels.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-300">Source</label>
          <input
            className="cyber-input mt-1"
            placeholder="Source contains..."
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="text-sm text-gray-300">From</label>
            <input
              type="date"
              className="cyber-input mt-1"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">To</label>
            <input
              type="date"
              className="cyber-input mt-1"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="cyber-btn flex-1" onClick={applyFilters}>
            Apply
          </button>

          <button
            className="cyber-btn flex-1"
            onClick={() => {
              setQ("");
              setLevel("ALL");
              setSource("");
              setDateFrom("");
              setDateTo("");
              setToast({ message: "Filters cleared", severity: "info" });
            }}
          >
            Clear
          </button>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Export Logs</h4>
          {hasRole(["corporate", "technical"]) ? (
            <>
              <button className="cyber-btn" onClick={exportCSV}>
                📥 Export CSV
              </button>
              <button className="cyber-btn" onClick={exportPDF}>
                📄 Export PDF
              </button>
            </>
          ) : (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
              <p className="text-yellow-400 font-semibold">🔒 Export Locked</p>
              <p className="text-gray-400 mt-1">Upgrade to Corporate or Technical</p>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE */}
      <main className="flex-1">
        {/* Graph */}
        <div className="glass-cyber p-4 mb-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">System Logs Timeline</h2>
            <span className="text-sm text-gray-300">{filtered.length} logs</span>
          </div>

          <div className="mt-3">
            {/* TimelineChart is optional — keep or replace with a simple summary */}
            {typeof TimelineChart === "function" ? (
              <TimelineChart data={timelineData} height={80} />
            ) : (
              <div className="text-sm text-gray-300">Timeline unavailable</div>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-cyber p-4 rounded-xl border border-white/10">
          <table className="w-full audit-table">
            <thead>
              <tr>
                <th className="p-2 text-left">Timestamp</th>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Source</th>
                <th className="p-2 text-left">Message</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((log, idx) => (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="p-2">{fmt(log.timestamp)}</td>

                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.level === "CRITICAL"
                          ? "badge-critical"
                          : log.level === "ERROR"
                          ? "badge-error"
                          : log.level === "WARNING"
                          ? "badge-warning"
                          : "badge-info"
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>

                  <td className="p-2">{log.source}</td>
                  <td className="p-2 break-words">{log.message}</td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-gray-400">
                    {loading ? "Loading logs..." : "No logs to display."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-4 gap-3">
            <button
              className="cyber-btn px-4 py-1"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <span className="text-gray-300 font-semibold">
              Page {page} / {Math.max(1, Math.ceil(filtered.length / perPage))}
            </span>

            <button
              className="cyber-btn px-4 py-1"
              disabled={page * perPage >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
