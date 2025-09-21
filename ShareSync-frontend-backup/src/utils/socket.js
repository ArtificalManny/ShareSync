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
 *   import socket, { onProjectPublicChanged, onProjectMembersUpdated } from "../utils/socket";
 *   const off = onProjectMembersUpdated(({ projectId, members, invites }) => { ... });
 *   // later: off();
 */
const hub = new EventTarget();

// Relay: public status changes
socket.on('project:publicChanged', (payload) => {
  try {
    const evt = new CustomEvent('project:publicChanged', { detail: payload });
    hub.dispatchEvent(evt);
  } catch (_) {}
});

// Relay: members updated (accept/revoke/role changes)
socket.on('project:membersUpdated', (payload) => {
  try {
    const evt = new CustomEvent('project:membersUpdated', { detail: payload });
    hub.dispatchEvent(evt);
  } catch (_) {}
});

// (Optional) files added relay if other parts want it
socket.on('project:filesAdded', (payload) => {
  try {
    const evt = new CustomEvent('project:filesAdded', { detail: payload });
    hub.dispatchEvent(evt);
  } catch (_) {}
});

export function onProjectPublicChanged(handler) {
  const wrapped = (e) => handler(e.detail);
  hub.addEventListener('project:publicChanged', wrapped);
  return () => hub.removeEventListener('project:publicChanged', wrapped);
}

export function onProjectMembersUpdated(handler) {
  const wrapped = (e) => handler(e.detail);
  hub.addEventListener('project:membersUpdated', wrapped);
  return () => hub.removeEventListener('project:membersUpdated', wrapped);
}

export function onProjectFilesAdded(handler) {
  const wrapped = (e) => handler(e.detail);
  hub.addEventListener('project:filesAdded', wrapped);
  return () => hub.removeEventListener('project:filesAdded', wrapped);
}

export default socket;
