// frontend/src/utils/socket.js
import { io } from "socket.io-client";

const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const socket = io(API_ROOT, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true,
});

// Optional debugging hooks
// socket.on("connect", () => console.log("Connected:", socket.id));
// socket.on("connect_error", (err) => console.error("Socket error:", err));

export default socket;
