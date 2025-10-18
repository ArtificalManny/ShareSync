// src/state/importStore.js
// Lightweight, framework-agnostic store for the import wizard.
// Usage:
//   import importStore from '../state/importStore';
//   const unsub = importStore.subscribe(state => { ... });
//   importStore.setProvider('linear'); importStore.setIssues([...]);

const listeners = new Set();

const state = {
  provider: null,     // 'linear' | 'jira'
  auth: null,         // { accessToken }
  issues: [],         // raw provider issues
  mapped: [],         // mapped tasks (parallel array to issues)
  selectedIds: new Set(), // which raw issue ids are selected
};

function notify() {
  listeners.forEach((fn) => {
    try { fn(get()); } catch {}
  });
}

function get() {
  // Freeze-like safety without deep clone
  return {
    provider: state.provider,
    auth: state.auth,
    issues: state.issues,
    mapped: state.mapped,
    selectedIds: new Set(state.selectedIds),
  };
}

function set(partial) {
  Object.assign(state, partial);
  notify();
}

function setProvider(provider) {
  set({ provider });
}

function setAuth(auth) {
  set({ auth });
}

function setIssues(issues = []) {
  const selectedIds = new Set(issues.map((i) => i.id));
  set({ issues, selectedIds });
}

function setMapped(mapped = []) {
  set({ mapped });
}

function toggleSelection(id) {
  const s = state.selectedIds;
  if (s.has(id)) s.delete(id);
  else s.add(id);
  notify();
}

function clear() {
  set({
    provider: null,
    auth: null,
    issues: [],
    mapped: [],
    selectedIds: new Set(),
  });
}

function subscribe(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  // Push current state immediately
  try { fn(get()); } catch {}
  return () => listeners.delete(fn);
}

const importStore = {
  // state access
  get,
  subscribe,
  // setters
  setProvider,
  setAuth,
  setIssues,
  setMapped,
  toggleSelection,
  clear,
};

export default importStore;
