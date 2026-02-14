// frontend/src/services/reportsService.js
import axiosInstance from "../utils/axiosConfig";

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const REPORTS_API = `${API_ROOT}/api/reports`;

/**
 * Generate summary report
 */
export async function generateSummaryReport(dateFrom, dateTo) {
  try {
    const res = await axiosInstance.post(`${REPORTS_API}/summary`, {
      date_from: dateFrom,
      date_to: dateTo,
    });
    return res.data;
  } catch (error) {
    console.error("❌ generateSummaryReport error:", error);
    throw error;
  }
}

/**
 * Export alerts as CSV
 */
export async function exportAlertsCSV(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const res = await axiosInstance.get(
      `${REPORTS_API}/export/alerts/csv?${params}`,
      {
        responseType: "blob",
      }
    );

    // Download file
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerts_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    return { status: "success" };
  } catch (error) {
    console.error("❌ exportAlertsCSV error:", error);
    throw error;
  }
}

/**
 * Export summary report as PDF
 */
export async function exportSummaryPDF(dateFrom, dateTo) {
  try {
    const res = await axiosInstance.post(
      `${REPORTS_API}/export/summary/pdf`,
      {
        date_from: dateFrom,
        date_to: dateTo,
      },
      {
        responseType: "blob",
      }
    );

    // Download file
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threattrace_report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

    return { status: "success" };
  } catch (error) {
    console.error("❌ exportSummaryPDF error:", error);
    throw error;
  }
}

export default {
  generateSummaryReport,
  exportAlertsCSV,
  exportSummaryPDF,
};
