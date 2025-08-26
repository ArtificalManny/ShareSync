// /src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const DEFAULT_WS = import.meta.env.VITE_WS_URL || '';
const DEFAULT_PATH = import.meta.env.VITE_WS_PATH || '/socket.io';

/**
 * useSocket(options)
 * - options.room: string | null  (e.g. "project:123", "user:abc"; joins on connect)
 * - options.authToken: string | null  (JWT for auth handshake, if your gateway expects it)
 * - options.onEvents: { [eventName: string]: (...args:any[]) => void }  (stable map of handlers)
 * - options.poller: () => void   (optional safety poller for missed events)
 * - options.url: string (override WS url)
 * - options.path: string (override socket path)
 *
 * Returns a ref to the Socket instance: socketRef.current
 */
export default function useSocket(options = {}) {
  const {
    room = null,
    authToken = null,
    onEvents = {},
    poller,
    url = DEFAULT_WS,      // empty means "same origin"
    path = DEFAULT_PATH,
  } = options;

  const socketRef = useRef(null);

  useEffect(() => {
    // Connect
    const socket = io(url, {
      path,
      withCredentials: true,
      transports: ['websocket'],
      auth: authToken ? { token: authToken } : undefined,
    });
    socketRef.current = socket;

    // Join room when connected (if provided)
    socket.on('connect', () => {
      if (room) socket.emit('join', { room });
    });

    // Wire event handlers
    const entries = Object.entries(onEvents || {});
    for (const [event, handler] of entries) {
      if (typeof handler === 'function') socket.on(event, handler);
    }

    // Optional backstop poller
    let pollTimer = null;
    if (typeof poller === 'function') {
      pollTimer = setInterval(() => poller(), 30_000);
    }

    return () => {
      // Unwire handlers
      for (const [event, handler] of entries) {
        if (typeof handler === 'function') socket.off(event, handler);
      }
      // Leave room + disconnect
      if (room) socket.emit('leave', { room });
      try { socket.disconnect(); } catch {}
      if (pollTimer) clearInterval(pollTimer);
    };
    // It’s important that we reconnect when any of these change:
  }, [room, authToken, url, path, JSON.stringify(Object.keys(onEvents || {}))]);

  return socketRef;
}