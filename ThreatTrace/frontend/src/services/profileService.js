import axiosInstance from "../utils/axiosConfig";
import { apiUrl } from "../utils/api";

const AUTH_API = apiUrl("/api/auth");

export async function getMyProfile() {
  const res = await axiosInstance.get(`${AUTH_API}/profile`);
  return res.data;
}

export async function updateMyProfile(payload) {
  const res = await axiosInstance.put(`${AUTH_API}/profile`, payload);
  return res.data;
}

export function cacheProfile(profile) {
  localStorage.setItem("user_profile", JSON.stringify(profile || {}));
}

export function readCachedProfile() {
  try {
    return JSON.parse(localStorage.getItem("user_profile") || "{}");
  } catch {
    return {};
  }
}

export default {
  getMyProfile,
  updateMyProfile,
  cacheProfile,
  readCachedProfile,
};


