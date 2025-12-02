// frontend/src/utils/socket.js
// Robust Socket.IO client for ThreatTrace UI
// Uses VITE_API_BASE when present, otherwise derives backend host from window.location.

import { io } from "socket.io-client";

const API_ROOT =
  import.meta.env.VITE_API_BASE ||
  (() => {
    // Derive from current page origin — assumes backend runs on same host but port 5000.
    try {
      const proto = window.location.protocol; // http: or https:
      const host = window.location.hostname; // e.g. 127.0.0.1 or 192.168.x.x
      // Prefer explicit env var for port; fallback to 5000
      const backendPort = import.meta.env.VITE_API_PORT || "5000";
      return `${proto}//${host}:${backendPort}`;
    } catch (e) {
      return "http://127.0.0.1:5000";
    }
  })();

// Determine secure flag automatically (important for websockets over TLS)
const isSecure = API_ROOT.startsWith("https:");

const socket = io(API_ROOT, {
  path: "/socket.io",
  transports: ["websocket", "polling"], // websocket primary, polling as fallback
  secure: isSecure,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,
  timeout: 20000,
  autoConnect: true,
  withCredentials: true, // send cookies if your backend uses them
});

// Optional: helpful debug hooks (comment out in production)
socket.on("connect", () => {
  // eslint-disable-next-line no-console
  console.log("[socket] connected", socket.id, "->", API_ROOT);
});
socket.on("connect_error", (err) => {
  // eslint-disable-next-line no-console
  console.warn("[socket] connect_error", err && err.message ? err.message : err);
});
socket.on("reconnect_attempt", (n) => {
  // eslint-disable-next-line no-console
  console.log(`[socket] reconnect attempt #${n}`);
});
socket.on("disconnect", (reason) => {
  // eslint-disable-next-line no-console
  console.log("[socket] disconnected:", reason);
});

export default socket;