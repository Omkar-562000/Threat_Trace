import axios from "axios";

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const API = `${API_ROOT}/api/ransomware`;

export async function uploadForScan(file) {
  const form = new FormData();
  form.append("file", file);

  return axios.post(`${API}/upload`, form);
}

export async function fetchRansomwareLogs() {
  return axios.get(`${API}/logs`);
}
