import { io } from "socket.io-client";

function getSocketUrl() {
  const raw =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_WS_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5050";

  return String(raw).replace(/\/api\/?$/, "").replace(/\/+$/, "");
}

function getToken() {
  return (
    localStorage.getItem("ss.token") ||
    localStorage.getItem("ss.jwt") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

export function makeSocket() {
  return io(getSocketUrl(), {
    transports: ["polling", "websocket"],
    upgrade: true,
    autoConnect: true,
    withCredentials: true,
    auth: {
      token: getToken(),
    },
  });
}
