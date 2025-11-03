/**
 * Simple formatting helpers for axes, tooltips, labels, and timestamps.
 */

/* ===== Numbers ===== */
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

/* ===== Feed-specific helpers (kept) ===== */
export const fmtWhen = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
};

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

/* ===== Centralized timestamp microcopy ===== */

/** “just now”, “Xm ago”, “Yh ago”, else “Mon DD” */
export function formatRelativeTime(dateish) {
  if (!dateish) return "";
  const ts = typeof dateish === "string" ? Date.parse(dateish) : +new Date(dateish);
  if (!Number.isFinite(ts)) return "";
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 8) return `${day}d ago`;

  try {
    const d = new Date(ts);
    const month = d.toLocaleString(undefined, { month: "short" });
    const dd = d.getDate();
    return `${month} ${dd}`;
  } catch {
    return "";
  }
}

/** “MMM d” e.g., “Jan 5” */
export function formatShortDate(dateish) {
  try {
    const d = new Date(dateish);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** Long datetime (locale-aware) */
export function formatLongDateTime(dateish) {
  try {
    const d = new Date(dateish);
    return d.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** “Updated 2h ago” (prefix configurable) */
export function labelledTimestamp(dateish, prefix = "Updated") {
  const rel = formatRelativeTime(dateish);
  return rel ? `${prefix} ${rel}` : "";
}

// ─────────────────────────────────────────────────────────────
// NEW MOMENTUM FORMATTERS
// ─────────────────────────────────────────────────────────────
export function formatMomentumScore(score) {
  if (typeof score !== "number") return "—";
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return `${s}`;
}

export function formatStreakDays(days) {
  if (typeof days !== "number") return "0d";
  return `${days}d`;
}