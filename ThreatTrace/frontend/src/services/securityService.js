import axiosInstance from "../utils/axiosConfig";

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const SECURITY_API = `${API_ROOT}/api/security`;

export async function getBlockedIps(active = true) {
  const res = await axiosInstance.get(`${SECURITY_API}/blocked-ips`, {
    params: { active },
  });
  return res.data;
}

export async function unblockIp(ip) {
  const res = await axiosInstance.post(`${SECURITY_API}/blocked-ips/${encodeURIComponent(ip)}/unblock`);
  return res.data;
}

export async function getQuarantinedUsers() {
  const res = await axiosInstance.get(`${SECURITY_API}/quarantined-users`);
  return res.data;
}

export async function releaseQuarantinedUser(userId) {
  const res = await axiosInstance.post(`${SECURITY_API}/quarantined-users/${userId}/release`);
  return res.data;
}

export async function getSecurityAuditTrail({ page = 1, per_page = 50, action = "", status = "", user_id = "" } = {}) {
  const res = await axiosInstance.get(`${SECURITY_API}/audit-trail`, {
    params: {
      page,
      per_page,
      action: action || undefined,
      status: status || undefined,
      user_id: user_id || undefined,
    },
  });
  return res.data;
}

export default {
  getBlockedIps,
  unblockIp,
  getQuarantinedUsers,
  releaseQuarantinedUser,
  getSecurityAuditTrail,
};
