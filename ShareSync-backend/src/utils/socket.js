import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5050";

// Dev-friendly socket config (no auth required tonight)
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
  withCredentials: true,
});

export function joinProjectRoom(projectId) {
  if (!projectId) return;
  socket.emit("joinProject", { projectId });
}

export function leaveProjectRoom(projectId) {
  if (!projectId) return;
  socket.emit("leaveProject", { projectId });
}
