// frontend/src/utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://127.0.0.1:5000";
const socket = io(SOCKET_URL, { autoConnect: true });

export default socket;
