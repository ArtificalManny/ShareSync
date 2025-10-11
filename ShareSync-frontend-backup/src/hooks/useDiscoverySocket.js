// src/hooks/useDiscoverySocket.js
// Minimal hook to listen for discovery bumps and keep rows fresh.

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * @param {(payload: { projectId: string, partial: any }) => void} onUpdate
 * @param {object} [opts]
 * @param {string} [opts.url] Optional Socket.IO server URL (default: same origin)
 * @param {object} [opts.ioOptions] Optional Socket.IO client options
 */
export default function useDiscoverySocket(onUpdate, opts = {}) {
  const { url, ioOptions } = opts;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    // Prefer explicit URL via env or argument; otherwise same-origin
    const endpoint =
      url ||
      import.meta?.env?.VITE_SOCKET_URL ||
      import.meta?.env?.VITE_API_BASE ||
      undefined;

    const socket = io(endpoint, {
      withCredentials: true,
      transports: ["websocket"],
      ...ioOptions,
    });

    // Join the "discovery" room on connect
    const join = () => socket.emit("join:discovery");
    socket.on("connect", join);

    // Handle live bumps
    const handler = (payload) => {
      try {
        onUpdateRef.current?.(payload);
      } catch (e) {
        // avoid throwing in an event handler
        // eslint-disable-next-line no-console
        console.error("[useDiscoverySocket] onUpdate error:", e);
      }
    };
    socket.on("discovery:projectUpdated", handler);

    // In case the tab sleeps / reconnects, rejoin the room
    socket.io.on("reconnect", join);

    return () => {
      // Leave room explicitly before disconnecting (nice-to-have)
      try {
        socket.emit("leave:discovery");
      } catch {}
      socket.off("discovery:projectUpdated", handler);
      socket.off("connect", join);
      socket.io.off("reconnect", join);
      socket.disconnect();
    };
  }, [url, ioOptions]);
}
