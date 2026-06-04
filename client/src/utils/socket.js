import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
  autoConnect: false,
  transports: ["polling", "websocket"], // polling first → upgrades to WS (needed for most cloud hosts)
  withCredentials: true, // required when frontend & backend are on different domains
});

export default socket;
