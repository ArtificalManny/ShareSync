// /src/state/metrics.js
const _metrics = { counters:{}, last:[] };

export function bumpCounter(key, delta = 1) {
  _metrics.counters[key] = (_metrics.counters[key] || 0) + delta;
  _metrics.last.unshift({ key, delta, at: Date.now() });
  _metrics.last = _metrics.last.slice(0, 200);
}

export function pushEvent(key, payload = {}) {
  _metrics.last.unshift({ key, payload, at: Date.now() });
  _metrics.last = _metrics.last.slice(0, 200);
  _metrics.counters[key] = (_metrics.counters[key] || 0) + 1;
}

export function getSnapshot() {
  return JSON.parse(JSON.stringify(_metrics));
}
