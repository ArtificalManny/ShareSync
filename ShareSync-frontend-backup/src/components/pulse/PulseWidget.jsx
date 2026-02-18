// src/components/pulse/PulseWidget.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PULSE WIDGET (Phase 2 Minimal)
// Uses tasks only to compute 3 live counts:
// 🔥 Today shipped, ⚡ In motion, ⛔ Blocked
// Updates instantly because parent passes liveTasks (patched by taskUpdated socket)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { Flame, Zap, OctagonAlert } from "lucide-react";

function safeStatus(t) {
  return (
    t?.status ??
    t?.state ??
    t?.column ??
    t?.phase ??
    ""
  );
}

function safeCompletedAt(t) {
  return (
    t?.completedAt ??
    t?.doneAt ??
    t?.completed_on ??
    t?.completed_on_utc ??
    null
  );
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDoneStatus(statusRaw) {
  const s = String(statusRaw || "").toLowerCase();
  return s === "done" || s === "completed" || s === "complete" || s === "shipped" || s === "closed";
}

function isBlockedStatus(statusRaw) {
  const s = String(statusRaw || "").toLowerCase();
  return s === "blocked" || s === "block" || s === "stuck";
}

function isInMotionStatus(statusRaw) {
  const s = String(statusRaw || "").toLowerCase();
  // Keep minimal + tolerant
  return (
    s === "in_progress" ||
    s === "in progress" ||
    s === "progress" ||
    s === "doing" ||
    s === "active" ||
    s === "review" ||
    s === "qa" ||
    s === "testing"
  );
}

export default function PulseWidget({ tasks = [], className = "" }) {
  const now = new Date();

  const counts = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];

    let todayShipped = 0;
    let inMotion = 0;
    let blocked = 0;

    for (const t of list) {
      const status = safeStatus(t);
      const completedAt = toDate(safeCompletedAt(t));

      if (completedAt && isSameLocalDay(completedAt, now)) {
        // If completed today, count it as shipped regardless of status wording
        todayShipped += 1;
      } else if (isDoneStatus(status)) {
        // Optional: if you have done tasks without completedAt, you might NOT want to count them as today
        // We keep minimal: only completedAt => today shipped.
      }

      if (isBlockedStatus(status)) blocked += 1;
      else if (isInMotionStatus(status)) inMotion += 1;
    }

    return { todayShipped, inMotion, blocked };
  }, [tasks]);

  return (
    <div
      className={[
        "p-6 rounded-2xl bg-surface-1 border border-white/[0.06]",
        "flex items-center justify-between gap-6",
        className,
      ].join(" ")}
    >
      <div>
        <div className="text-sm font-medium text-text-secondary tracking-wide uppercase">
          Pulse
        </div>
        <div className="text-xs text-text-tertiary mt-1">
          Live counts from tasks
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* 🔥 Today shipped */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-warning-500/10 border border-warning-500/15 flex items-center justify-center">
            <Flame className="w-4 h-4 text-warning-400" />
          </div>
          <div>
            <div className="text-xs text-text-tertiary">Today</div>
            <div className="text-sm font-semibold text-text-primary">
              {counts.todayShipped} shipped
            </div>
          </div>
        </div>

        {/* ⚡ In motion */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <div className="text-xs text-text-tertiary">In motion</div>
            <div className="text-sm font-semibold text-text-primary">
              {counts.inMotion}
            </div>
          </div>
        </div>

        {/* ⛔ Blocked */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-error-500/10 border border-error-500/15 flex items-center justify-center">
            <OctagonAlert className="w-4 h-4 text-error-400" />
          </div>
          <div>
            <div className="text-xs text-text-tertiary">Blocked</div>
            <div className="text-sm font-semibold text-text-primary">
              {counts.blocked}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
