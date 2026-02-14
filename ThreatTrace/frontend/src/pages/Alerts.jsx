// frontend/src/pages/Alerts.jsx
import { useCallback, useEffect, useState } from "react";
import {
  acknowledgeAlert,
  bulkAcknowledgeAlerts,
  bulkResolveAlerts,
  deleteAlert,
  getAlerts,
  getAlertStats,
  resolveAlert,
} from "../services/alertsService";
import Toast from "../components/ui/Toast";
import socket from "../utils/socket";
import { hasRole } from "../utils/role";

export default function Alerts() {
  /* ===============================
     States
  =============================== */
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    acknowledged: 0,
    resolved: 0,
  });
  
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  
  // Selection for bulk operations
  const [selected, setSelected] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 20;
  
  // Role permissions
  const canDelete = hasRole(["technical"]);

  /* ===============================
     Toast Helper
  =============================== */
  const pushToast = (msg, severity = "info") => {
    setToast({ msg, severity });
    setTimeout(() => setToast(null), 4500);
  };

  /* ===============================
     Fetch Alerts & Stats
  =============================== */
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlerts({
        severity,
        status,
        source,
        page,
        per_page: perPage,
      });
      
      if (res.status === "success") {
        setAlerts(res.alerts || []);
      }
    } catch (error) {
      pushToast("Failed to load alerts", "error");
    } finally {
      setLoading(false);
    }
  }, [severity, status, source, page]);

  const loadStats = useCallback(async () => {
    try {
      const res = await getAlertStats();
      if (res.status === "success") {
        setStats(res.stats || stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    loadStats();
  }, [loadAlerts, loadStats]);

  /* ===============================
     Real-time Updates via WebSocket
  =============================== */
  useEffect(() => {
    const handleNewAlert = (data) => {
      pushToast(`New Alert: ${data.title || data.message}`, "warning");
      loadAlerts();
      loadStats();
    };

    socket.on("new_alert", handleNewAlert);
    socket.on("ransomware_alert", handleNewAlert);
    socket.on("tamper_alert", handleNewAlert);

    return () => {
      socket.off("new_alert", handleNewAlert);
      socket.off("ransomware_alert", handleNewAlert);
      socket.off("tamper_alert", handleNewAlert);
    };
  }, [loadAlerts, loadStats]);

  /* ===============================
     Actions
  =============================== */
  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      pushToast("Alert acknowledged", "success");
      loadAlerts();
      loadStats();
    } catch (error) {
      pushToast("Failed to acknowledge alert", "error");
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
      pushToast("Alert resolved", "success");
      loadAlerts();
      loadStats();
    } catch (error) {
      pushToast("Failed to resolve alert", "error");
    }
  };

  const handleDelete = async (alertId) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;
    
    try {
      await deleteAlert(alertId);
      pushToast("Alert deleted", "success");
      loadAlerts();
      loadStats();
    } catch (error) {
      pushToast("Failed to delete alert", "error");
    }
  };

  /* ===============================
     Bulk Operations
  =============================== */
  const handleBulkAcknowledge = async () => {
    if (selected.length === 0) {
      pushToast("No alerts selected", "warning");
      return;
    }
    
    try {
      await bulkAcknowledgeAlerts(selected);
      pushToast(`${selected.length} alerts acknowledged`, "success");
      setSelected([]);
      loadAlerts();
      loadStats();
    } catch (error) {
      pushToast("Failed to acknowledge alerts", "error");
    }
  };

  const handleBulkResolve = async () => {
    if (selected.length === 0) {
      pushToast("No alerts selected", "warning");
      return;
    }
    
    try {
      await bulkResolveAlerts(selected);
      pushToast(`${selected.length} alerts resolved`, "success");
      setSelected([]);
      loadAlerts();
      loadStats();
    } catch (error) {
      pushToast("Failed to resolve alerts", "error");
    }
  };

  /* ===============================
     Selection Handlers
  =============================== */
  const toggleSelection = (alertId) => {
    setSelected((prev) =>
      prev.includes(alertId)
        ? prev.filter((id) => id !== alertId)
        : [...prev, alertId]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === alerts.length) {
      setSelected([]);
    } else {
      setSelected(alerts.map((a) => a._id));
    }
  };

  /* ===============================
     Severity Badge Color
  =============================== */
  const getSeverityColor = (sev) => {
    const map = {
      critical: "bg-red-600",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
      info: "bg-gray-500",
    };
    return map[sev?.toLowerCase()] || map.info;
  };

  const getStatusColor = (stat) => {
    const map = {
      active: "bg-red-500",
      acknowledged: "bg-yellow-500",
      resolved: "bg-green-500",
    };
    return map[stat?.toLowerCase()] || map.active;
  };

  /* ===============================
     Render
  =============================== */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl cyber-gradient-text mb-2">Threat Alerts</h2>
        <p className="text-gray-400">Monitor and manage security alerts</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card bg-gradient-to-br from-purple-900/20 to-purple-600/10 border-purple-500/30">
          <h3 className="text-sm text-gray-400 mb-1">Total Alerts</h3>
          <p className="text-3xl font-bold text-purple-400">{stats.total}</p>
        </div>
        
        <div className="cyber-card bg-gradient-to-br from-red-900/20 to-red-600/10 border-red-500/30">
          <h3 className="text-sm text-gray-400 mb-1">Active</h3>
          <p className="text-3xl font-bold text-red-400">{stats.active}</p>
        </div>
        
        <div className="cyber-card bg-gradient-to-br from-yellow-900/20 to-yellow-600/10 border-yellow-500/30">
          <h3 className="text-sm text-gray-400 mb-1">Acknowledged</h3>
          <p className="text-3xl font-bold text-yellow-400">{stats.acknowledged}</p>
        </div>
        
        <div className="cyber-card bg-gradient-to-br from-green-900/20 to-green-600/10 border-green-500/30">
          <h3 className="text-sm text-gray-400 mb-1">Resolved</h3>
          <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="cyber-card">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Severity</label>
            <select
              className="cyber-input"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-2">Status</label>
            <select
              className="cyber-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-2">Source</label>
            <input
              type="text"
              className="cyber-input"
              placeholder="Filter by source..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="cyber-card bg-purple-900/20">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-300">
              {selected.length} alert{selected.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleBulkAcknowledge}
              className="cyber-btn bg-yellow-600 hover:bg-yellow-700"
            >
              Acknowledge Selected
            </button>
            <button
              onClick={handleBulkResolve}
              className="cyber-btn bg-green-600 hover:bg-green-700"
            >
              Resolve Selected
            </button>
            <button
              onClick={() => setSelected([])}
              className="cyber-btn bg-gray-600 hover:bg-gray-700"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      <div className="cyber-card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Alerts</h3>
          <button
            onClick={toggleSelectAll}
            className="text-sm text-cyberPurple hover:underline"
          >
            {selected.length === alerts.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No alerts found</div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected.includes(alert._id)}
                    onChange={() => toggleSelection(alert._id)}
                    className="mt-1"
                  />

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold text-white ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity?.toUpperCase() || "INFO"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(
                          alert.status
                        )}`}
                      >
                        {alert.status?.toUpperCase() || "ACTIVE"}
                      </span>
                      {alert.source && (
                        <span className="text-xs text-gray-400">
                          Source: {alert.source}
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-white mb-1">
                      {alert.title || "Alert"}
                    </h4>
                    <p className="text-sm text-gray-300 mb-2">
                      {alert.message}
                    </p>

                    {alert.timestamp && (
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {alert.status === "active" && (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm text-white"
                      >
                        Acknowledge
                      </button>
                    )}
                    
                    {(alert.status === "active" || alert.status === "acknowledged") && (
                      <button
                        onClick={() => handleResolve(alert._id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                      >
                        Resolve
                      </button>
                    )}
                    
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(alert._id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && alerts.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="cyber-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={alerts.length < perPage}
              className="cyber-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.msg}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
