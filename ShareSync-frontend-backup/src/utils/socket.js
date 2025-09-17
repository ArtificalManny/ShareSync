// src/utils/socket.js
import { io } from 'socket.io-client';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  process.env.VITE_API_URL ||
  'http://localhost:5000';

const socket = io(API_BASE, {
  withCredentials: true,
  autoConnect: true,
});

/**
 * Light event hub so views/stores can subscribe without importing socket.io everywhere.
 * Usage:
 *   import socket, { onProjectPublicChanged } from "../utils/socket";
 *   const off = onProjectPublicChanged(({ projectId, publicEnabled, publicToken }) => { ... });
 *   // later: off();
 */
const hub = new EventTarget();

socket.on('project:publicChanged', (payload) => {
  try {
    const evt = new CustomEvent('project:publicChanged', { detail: payload });
    hub.dispatchEvent(evt);
  } catch (_) {}
});

export function onProjectPublicChanged(handler) {
  const wrapped = (e) => handler(e.detail);
  hub.addEventListener('project:publicChanged', wrapped);
  return () => hub.removeEventListener('project:publicChanged', wrapped);
}

export default socket;
