// src/utils/perfLog.js
export function perfLog(name, startMark, endNow = true) {
    try {
      if (endNow) performance.mark(`${name}:end`);
      performance.measure(name, startMark, endNow ? `${name}:end` : undefined);
      const entries = performance.getEntriesByName(name);
      const last = entries[entries.length - 1];
      if (last) console.log(`[Perf] ${name}: ${Math.round(last.duration)} ms`);
    } catch {}
  }
  