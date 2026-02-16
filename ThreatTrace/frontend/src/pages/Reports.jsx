// frontend/src/pages/Reports.jsx
import { useCallback, useEffect, useState } from "react";
import {
  exportAlertsCSV,
  exportSummaryPDF,
  generateSummaryReport,
} from "../services/reportsService";
import Toast from "../components/ui/Toast";
import { hasFeature } from "../utils/role";

export default function Reports() {
  /* ===============================
     States
  =============================== */
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Date range
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Report data
  const [report, setReport] = useState(null);

  // Role permissions
  const canExport = hasFeature("reports_export");

  /* ===============================
     Toast Helper
  =============================== */
  const pushToast = (msg, severity = "info") => {
    setToast({ msg, severity });
    setTimeout(() => setToast(null), 4500);
  };

  /* ===============================
     Set Default Date Range (Last 30 days)
  =============================== */
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    setDateTo(today.toISOString().split("T")[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  /* ===============================
     Generate Report
  =============================== */
  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo) {
      pushToast("Please select date range", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await generateSummaryReport(dateFrom, dateTo);

      if (res.status === "success") {
        setReport(res.report);
        pushToast("Report generated successfully", "success");
      } else {
        pushToast(res.message || "Failed to generate report", "error");
      }
    } catch (error) {
      console.error("Generate report error:", error);
      pushToast(
        error.response?.data?.message || "Failed to generate report",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Export Handlers
  =============================== */
  const handleExportCSV = async () => {
    if (!canExport) {
      pushToast("Corporate/Technical role required to export", "error");
      return;
    }

    setExporting(true);
    try {
      await exportAlertsCSV({ date_from: dateFrom, date_to: dateTo });
      pushToast("CSV export started", "success");
    } catch (error) {
      console.error("Export CSV error:", error);
      pushToast(
        error.response?.data?.message || "Failed to export CSV",
        "error"
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canExport) {
      pushToast("Corporate/Technical role required to export", "error");
      return;
    }

    setExporting(true);
    try {
      await exportSummaryPDF(dateFrom, dateTo);
      pushToast("PDF export started", "success");
    } catch (error) {
      console.error("Export PDF error:", error);
      pushToast(
        error.response?.data?.message || "Failed to export PDF",
        "error"
      );
    } finally {
      setExporting(false);
    }
  };

  /* ===============================
     Quick Date Presets
  =============================== */
  const setQuickRange = (days) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - days);

    setDateTo(today.toISOString().split("T")[0]);
    setDateFrom(pastDate.toISOString().split("T")[0]);
  };

  /* ===============================
     Render
  =============================== */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl cyber-gradient-text mb-2">Security Reports</h2>
        <p className="text-gray-400">
          Generate comprehensive security reports and analytics
        </p>
      </div>

      {/* Date Range Selection */}
      <div className="cyber-card">
        <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setQuickRange(1)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white"
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => setQuickRange(7)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setQuickRange(30)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setQuickRange(90)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white"
          >
            Last 90 Days
          </button>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              From Date
            </label>
            <input
              type="date"
              className="cyber-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">To Date</label>
            <input
              type="date"
              className="cyber-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="cyber-btn w-full md:w-auto"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* Export Actions */}
      {canExport && (
        <div className="cyber-card bg-gradient-to-br from-purple-900/20 to-purple-600/10 border-purple-500/30">
          <h3 className="text-lg font-semibold mb-3">Export Options</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="cyber-btn bg-green-600 hover:bg-green-700"
            >
              {exporting ? "Exporting..." : "📥 Export Alerts (CSV)"}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="cyber-btn bg-red-600 hover:bg-red-700"
            >
              {exporting ? "Exporting..." : "📄 Export Summary (PDF)"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Available for Corporate and Technical users
          </p>
        </div>
      )}

      {/* Report Summary */}
      {report && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="cyber-card">
            <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-purple-900/20 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">Total Alerts</h4>
                <p className="text-2xl font-bold text-purple-400">
                  {report.summary?.total_alerts || 0}
                </p>
              </div>

              <div className="bg-red-900/20 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">
                  Ransomware Scans
                </h4>
                <p className="text-2xl font-bold text-red-400">
                  {report.summary?.total_scans || 0}
                </p>
              </div>

              <div className="bg-yellow-900/20 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">Integrity Checks</h4>
                <p className="text-2xl font-bold text-yellow-400">
                  {report.summary?.total_audits || 0}
                </p>
              </div>

              <div className="bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">System Logs</h4>
                <p className="text-2xl font-bold text-blue-400">
                  {report.summary?.total_logs || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Alerts by Severity */}
          {report.alerts_by_severity &&
            Object.keys(report.alerts_by_severity).length > 0 && (
              <div className="cyber-card">
                <h3 className="text-lg font-semibold mb-4">
                  Alerts by Severity
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(report.alerts_by_severity).map(
                    ([severity, count]) => (
                      <div
                        key={severity}
                        className="bg-white/5 rounded-lg p-3 text-center"
                      >
                        <p className="text-sm text-gray-400 mb-1">
                          {severity.toUpperCase()}
                        </p>
                        <p className="text-xl font-bold">{count}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Alerts by Source */}
          {report.alerts_by_source &&
            Object.keys(report.alerts_by_source).length > 0 && (
              <div className="cyber-card">
                <h3 className="text-lg font-semibold mb-4">
                  Alerts by Source
                </h3>
                <div className="space-y-2">
                  {Object.entries(report.alerts_by_source).map(
                    ([source, count]) => (
                      <div
                        key={source}
                        className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                      >
                        <span className="text-gray-300">{source}</span>
                        <span className="font-semibold text-cyberPurple">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Top Threats */}
          {report.top_threats && report.top_threats.length > 0 && (
            <div className="cyber-card">
              <h3 className="text-lg font-semibold mb-4">Top Threats</h3>
              <div className="space-y-3">
                {report.top_threats.map((threat, idx) => (
                  <div
                    key={idx}
                    className="border border-white/10 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">
                        {threat.title || "Threat"}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          threat.severity === "critical"
                            ? "bg-red-600"
                            : threat.severity === "high"
                            ? "bg-orange-500"
                            : threat.severity === "medium"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {threat.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{threat.message}</p>
                    {threat.timestamp && (
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(threat.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activities */}
          {report.recent_activities && report.recent_activities.length > 0 && (
            <div className="cyber-card">
              <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
              <div className="space-y-2">
                {report.recent_activities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">
                        {activity.message || activity.description}
                      </p>
                      {activity.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !report && (
        <div className="cyber-card text-center py-12">
          <p className="text-gray-400 mb-4">
            Select a date range and click "Generate Report" to view analytics
          </p>
        </div>
      )}

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
