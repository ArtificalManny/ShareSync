// src/state/notifications.js
let subs = new Set();
let state = { items: [], unread: 0 };

const LS_KEY = 'ss.notifications.v1';
try {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) state = JSON.parse(raw);
} catch {}

function emit() {
  for (const cb of subs) cb(state);
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

export function addNotification(item) {
  state.items = [{ id: `n-${Date.now()}`, when: Date.now(), ...item }, ...state.items].slice(0, 30);
  state.unread += 1;
  emit();
}
export function clearUnread() { state.unread = 0; emit(); }

export function useNotifications(subscribe) {
  return {
    getSnapshot: () => state,
    subscribe: (cb) => { subs.add(cb); return () => subs.delete(cb); },
  };
}
