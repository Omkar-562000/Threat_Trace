// frontend/src/services/alertsService.js
import axiosInstance from "../utils/axiosConfig";

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const ALERTS_API = `${API_ROOT}/api/alerts`;

/**
 * Get alerts with filters
 */
export async function getAlerts({
  severity = "",
  source = "",
  status = "",
  date_from = "",
  date_to = "",
  page = 1,
  per_page = 50,
} = {}) {
  try {
    const params = {
      severity,
      source,
      status,
      date_from,
      date_to,
      page,
      per_page,
    };

    const res = await axiosInstance.get(`${ALERTS_API}/`, { params });
    return res.data;
  } catch (error) {
    console.error("❌ getAlerts error:", error);
    throw error;
  }
}

/**
 * Get alert statistics
 */
export async function getAlertStats() {
  try {
    const res = await axiosInstance.get(`${ALERTS_API}/stats`);
    return res.data;
  } catch (error) {
    console.error("❌ getAlertStats error:", error);
    throw error;
  }
}

/**
 * Acknowledge single alert
 */
export async function acknowledgeAlert(alertId, acknowledgedBy = "user") {
  try {
    const res = await axiosInstance.post(
      `${ALERTS_API}/${alertId}/acknowledge`,
      { acknowledged_by: acknowledgedBy }
    );
    return res.data;
  } catch (error) {
    console.error("❌ acknowledgeAlert error:", error);
    throw error;
  }
}

/**
 * Resolve single alert
 */
export async function resolveAlert(alertId, resolvedBy = "user", note = "") {
  try {
    const res = await axiosInstance.post(`${ALERTS_API}/${alertId}/resolve`, {
      resolved_by: resolvedBy,
      note,
    });
    return res.data;
  } catch (error) {
    console.error("❌ resolveAlert error:", error);
    throw error;
  }
}

/**
 * Delete alert (Technical only)
 */
export async function deleteAlert(alertId) {
  try {
    const res = await axiosInstance.delete(`${ALERTS_API}/${alertId}`);
    return res.data;
  } catch (error) {
    console.error("❌ deleteAlert error:", error);
    throw error;
  }
}

/**
 * Bulk acknowledge alerts
 */
export async function bulkAcknowledgeAlerts(
  alertIds,
  acknowledgedBy = "user"
) {
  try {
    const res = await axiosInstance.post(`${ALERTS_API}/bulk/acknowledge`, {
      alert_ids: alertIds,
      acknowledged_by: acknowledgedBy,
    });
    return res.data;
  } catch (error) {
    console.error("❌ bulkAcknowledgeAlerts error:", error);
    throw error;
  }
}

/**
 * Bulk resolve alerts
 */
export async function bulkResolveAlerts(alertIds, resolvedBy = "user") {
  try {
    const res = await axiosInstance.post(`${ALERTS_API}/bulk/resolve`, {
      alert_ids: alertIds,
      resolved_by: resolvedBy,
    });
    return res.data;
  } catch (error) {
    console.error("❌ bulkResolveAlerts error:", error);
    throw error;
  }
}

export default {
  getAlerts,
  getAlertStats,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
  bulkAcknowledgeAlerts,
  bulkResolveAlerts,
};
