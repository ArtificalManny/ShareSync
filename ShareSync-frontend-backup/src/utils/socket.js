import { io } from "socket.io-client";

const WS_URL = (import.meta.env.VITE_WS_URL || "http://localhost:5050").replace(/\/$/, "");

// If you previously used auth tokens in socket handshake, keep it:
function getToken() {
  return localStorage.getItem("ss.token") || localStorage.getItem("ss.jwt") || "";
}

export function makeSocket() {
  return io(WS_URL, {
    transports: ["websocket"],
    auth: {
      token: getToken(),
    },
  });
}
