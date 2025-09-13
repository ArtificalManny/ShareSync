/**
 * Simple formatting helpers for axes, tooltips, and labels.
 */

export const fmtNumber = (n, opts) =>
  new Intl.NumberFormat(undefined, opts).format(Number(n) || 0);

export const fmtCompact = (n) =>
  fmtNumber(n, { notation: "compact", maximumFractionDigits: 1 });

export const fmtPercent = (n, dp = 0) => {
  const v = typeof n === "number" && n > 1 ? n / 100 : Number(n) || 0; // accept 0-1 or 0-100
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: dp,
  }).format(v);
};

export const fmtAxisNumber = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000) return fmtCompact(v);
  return fmtNumber(v, { maximumFractionDigits: 0 });
};

export const fmtAxisPercent = (n) => {
  // n may be already 0..1 or 0..100; show compact and clamp
  const v = Number(n) || 0;
  const asUnit = v > 1 ? v / 100 : v;
  return fmtPercent(asUnit, 0);
};

export const fmtDateLabel = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return String(ts);
  }
};

/* ====== Feed-specific helpers (new) ===================================== */

export const fmtWhen = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
};

/** Build a reasonable event title from a heterogeneous activity. */
export const titleFromActivity = (evt) => {
  const t = (evt?.type || "").toLowerCase();
  if (t.startsWith("task.")) {
    const label = evt?.title || evt?.meta?.title || "Task";
    if (t.includes("completed")) return `Task completed: ${label}`;
    if (t.includes("created")) return `Task created: ${label}`;
    if (t.includes("updated")) return `Task updated: ${label}`;
    if (t.includes("assigned")) return `Task assigned: ${label}`;
    return `Task: ${label}`;
  }
  if (t.startsWith("file.")) {
    const name = evt?.name || evt?.filename || evt?.text || "File";
    return `File: ${name}`;
  }
  if (t.startsWith("audit.") || t.includes("project.updated")) {
    return evt?.summary || evt?.text || evt?.title || "System event";
  }
  return evt?.text || evt?.title || "Update";
};

/** Optional: summarize a diff/patch object into small badges like “status → Done”. */
export const summarizeDiff = (patch = {}) => {
  const out = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && "from" in v && "to" in v) {
      out.push(`${k}: ${String(v.from)} → ${String(v.to)}`);
    } else {
      out.push(`${k}: ${String(v)}`);
    }
  }
  return out;
};
