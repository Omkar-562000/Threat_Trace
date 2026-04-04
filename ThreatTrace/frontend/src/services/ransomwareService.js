import axios from "axios";
import { apiUrl } from "../utils/api";

const API = apiUrl("/api/ransomware");

export async function uploadForScan(file) {
  const form = new FormData();
  form.append("file", file);

  return axios.post(`${API}/upload`, form);
}

export async function fetchRansomwareLogs() {
  return axios.get(`${API}/logs`);
}


