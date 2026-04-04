const DEFAULT_LOCAL_API_BASE = "http://127.0.0.1:5000";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export function getApiBase() {
  const configuredBase = (import.meta.env.VITE_API_BASE || "").trim();
  if (configuredBase) {
    return trimTrailingSlash(configuredBase);
  }

  if (import.meta.env.DEV) {
    return "";
  }

  try {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = import.meta.env.VITE_API_PORT || "5000";
    return `${protocol}//${hostname}:${port}`;
  } catch {
    return DEFAULT_LOCAL_API_BASE;
  }
}

export const API_BASE = getApiBase();

export function apiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}
