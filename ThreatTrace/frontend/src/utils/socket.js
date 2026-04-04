import { io } from "socket.io-client";
import { API_BASE } from "./api";

const isSecure = API_BASE.startsWith("https:");
const socketTarget = API_BASE || undefined;

const socket = io(socketTarget, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  secure: isSecure,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,
  timeout: 20000,
  autoConnect: true,
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("[socket] connected", socket.id, "->", socketTarget || "same-origin");
});
socket.on("connect_error", (err) => {
  console.warn("[socket] connect_error", err && err.message ? err.message : err);
});
socket.on("reconnect_attempt", (n) => {
  console.log(`[socket] reconnect attempt #${n}`);
});
socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason);
});

export default socket;
