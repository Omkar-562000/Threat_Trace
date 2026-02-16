import axiosInstance from "../utils/axiosConfig";

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const CANARY_API = `${API_ROOT}/api/canary`;

export async function createCanaryAsset({ name, asset_type = "link", metadata = {} } = {}) {
  const res = await axiosInstance.post(`${CANARY_API}/assets`, {
    name,
    asset_type,
    metadata,
  });
  return res.data;
}

export async function getCanaryAssets() {
  const res = await axiosInstance.get(`${CANARY_API}/assets`);
  return res.data;
}

export async function getCanaryTriggers() {
  const res = await axiosInstance.get(`${CANARY_API}/triggers`);
  return res.data;
}

export async function getCanaryAllowlist() {
  const res = await axiosInstance.get(`${CANARY_API}/allowlist`);
  return res.data;
}

export async function addCanaryAllowlistEntry({ cidr, label }) {
  const res = await axiosInstance.post(`${CANARY_API}/allowlist`, { cidr, label });
  return res.data;
}

export async function deleteCanaryAllowlistEntry(entryId) {
  const res = await axiosInstance.delete(`${CANARY_API}/allowlist/${entryId}`);
  return res.data;
}

export async function getCanaryChallengeResponses() {
  const res = await axiosInstance.get(`${CANARY_API}/challenge-responses`);
  return res.data;
}

export function buildCanaryTrapUrl(token) {
  if (!token) return "";
  return `${CANARY_API}/trap/${token}`;
}

export default {
  createCanaryAsset,
  getCanaryAssets,
  getCanaryTriggers,
  getCanaryAllowlist,
  addCanaryAllowlistEntry,
  deleteCanaryAllowlistEntry,
  getCanaryChallengeResponses,
  buildCanaryTrapUrl,
};
