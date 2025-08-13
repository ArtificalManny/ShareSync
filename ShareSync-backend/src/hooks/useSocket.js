// src/hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * useSocket(room, { onEvents, poller })
 * - room: string like "project:<id>" or "user:<id>"
 * - onEvents: { [eventName]: (payload) => void }
 * - poller: optional () => void; called periodically if socket drops (fallback)
 */
export default function useSocket(room, { onEvents = {}, poller } = {}) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const pollRef = useRef(null);

  const startPolling = useCallback(() => {
    if (!poller) return;
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      try { poller(); } catch {}
    }, 5000);
  }, [poller]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    const s = io('/', {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = s;

    const handleConnect = () => {
      setConnected(true);
      stopPolling();
      if (room) s.emit('join', { room });
    };
    const handleDisconnect = () => {
      setConnected(false);
      startPolling();
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    // wire custom events
    for (const [evt, fn] of Object.entries(onEvents)) {
      if (typeof fn === 'function') s.on(evt, fn);
    }

    return () => {
      if (room) s.emit('leave', { room });
      for (const [evt, fn] of Object.entries(onEvents)) {
        if (typeof fn === 'function') s.off(evt, fn);
      }
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.close();
      stopPolling();
    };
  }, [room, onEvents, startPolling, stopPolling]);

  return { socket: socketRef.current, connected };
}
