export function getTaskId(t) {
  return t?.id || t?._id || null;
}

export function normalizeRealtimeTask(t) {
  if (!t || typeof t !== 'object') return t;

  const allowed = new Set(['early', 'on_time', 'late', 'at_risk', null, undefined]);
  const scheduleState = allowed.has(t.scheduleState) ? t.scheduleState : null;

  return {
    ...t,
    id: t.id || t._id,
    dueDate: t.dueDate ?? null,
    completedAt: t.completedAt ?? null,
    scheduleState,
  };
}

export function applyTaskUpdated(prevTasks, payload) {
  const list = Array.isArray(prevTasks) ? prevTasks : [];
  if (!payload) return list;

  if (payload.deleted) {
    const id = payload.id || payload._id;
    if (!id) return list;
    return list.filter((t) => getTaskId(t) !== id);
  }

  const incoming = normalizeRealtimeTask(payload);
  const incomingId = getTaskId(incoming);
  if (!incomingId) return list;

  const idx = list.findIndex((t) => getTaskId(t) === incomingId);
  if (idx === -1) return [incoming, ...list];

  const next = list.slice();
  next[idx] = { ...next[idx], ...incoming };
  return next;
}
