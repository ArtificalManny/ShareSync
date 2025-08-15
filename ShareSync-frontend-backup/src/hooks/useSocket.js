// /src/hooks/useSocket.js (frontend)
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000'; // same as Nest

/**
 * useSocket(room, options)
 * - room: string | null  (e.g. "project:123" or null to disable)
 * - options.onEvents: { [eventName: string]: (...args:any[]) => void }
 * - options.poller: () => void   (optional safety poller)
 */
export default function useSocket(room, options = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(options.onEvents || {});
  handlersRef.current = options.onEvents || {};

  useEffect(() => {
    if (!room) return;

    // connect once per room change
    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // join the logical room
    socket.emit('join', { room });

    // wire event handlers
    const handlers = handlersRef.current;
    Object.entries(handlers).forEach(([event, fn]) => {
      if (typeof fn === 'function') socket.on(event, fn);
    });

    // optional backstop poller in case events are missed
    let pollTimer = null;
    if (typeof options.poller === 'function') {
      pollTimer = setInterval(() => options.poller(), 30_000);
    }

    return () => {
      // unwire handlers
      Object.entries(handlers).forEach(([event, fn]) => {
        if (typeof fn === 'function') socket.off(event, fn);
      });
      // leave room + disconnect
      socket.emit('leave', { room });
      socket.disconnect();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [room]); // re-connect when room changes
}
