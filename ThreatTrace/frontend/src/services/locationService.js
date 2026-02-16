import axiosInstance from "../utils/axiosConfig";

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
const LOCATIONS_API = `${API_ROOT}/api/locations`;

export async function getLocationEvents({
  severity = "",
  source = "",
  event_type = "",
  page = 1,
  per_page = 25,
} = {}) {
  const params = {
    severity: severity || undefined,
    source: source || undefined,
    event_type: event_type || undefined,
    page,
    per_page,
  };

  const res = await axiosInstance.get(`${LOCATIONS_API}/`, { params });
  return res.data;
}

export async function getRecentLocationPoints(hours = 24) {
  const res = await axiosInstance.get(`${LOCATIONS_API}/recent`, {
    params: { hours },
  });
  return res.data;
}

export async function getLocationEventById(eventId) {
  const res = await axiosInstance.get(`${LOCATIONS_API}/${eventId}`);
  return res.data;
}

export async function ingestLocationEvent(payload) {
  const res = await axiosInstance.post(`${LOCATIONS_API}/ingest`, payload);
  return res.data;
}

export default {
  getLocationEvents,
  getRecentLocationPoints,
  getLocationEventById,
  ingestLocationEvent,
};
