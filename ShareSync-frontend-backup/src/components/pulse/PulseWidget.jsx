// src/components/pulse/PulseWidget.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PULSE WIDGET (Phase 2 Minimal)
// Uses tasks only to compute 3 live counts:
// 🔥 Today shipped, ⚡ In motion, ⛔ Blocked
// Updates instantly because parent passes liveTasks (patched by taskUpdated socket)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { Flame, Zap, OctagonAlert, Activity } from "lucide-react";

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

function StatPill({ icon: Icon, iconBg, iconColor, label, value, accent }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400">{label}</div>
        <div className={`text-lg font-bold ${accent}`}>{value}</div>
      </div>
    </div>
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
        todayShipped += 1;
      }

      if (isBlockedStatus(status)) blocked += 1;
      else if (isInMotionStatus(status)) inMotion += 1;
    }

    return { todayShipped, inMotion, blocked };
  }, [tasks]);

  // Determine pulse state for ambient accent
  const pulseState = counts.blocked > 0
    ? { label: "Needs Attention", dotColor: "bg-red-500", textColor: "text-red-500" }
    : counts.inMotion > 0
      ? { label: "In Motion", dotColor: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400" }
      : { label: "Ready", dotColor: "bg-slate-400", textColor: "text-slate-500" };

  return (
    <div
      className={[
        "relative p-6 rounded-2xl",
        "bg-white dark:bg-[#111113]",
        "border border-slate-200 dark:border-white/[0.06]",
        "shadow-sm dark:shadow-none",
        className,
      ].join(" ")}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 tracking-wide">
              Pulse
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Live counts from {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseState.dotColor} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseState.dotColor}`}></span>
          </span>
          <span className={`text-xs font-medium ${pulseState.textColor}`}>
            {pulseState.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-4">
        <StatPill
          icon={Flame}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconColor="text-amber-500"
          label="Today"
          value={`${counts.todayShipped} shipped`}
          accent="text-slate-800 dark:text-zinc-100"
        />

        {/* Divider */}
        <div className="w-px h-10 bg-slate-200 dark:bg-white/[0.06]" />

        <StatPill
          icon={Zap}
          iconBg="bg-violet-50 dark:bg-violet-500/10"
          iconColor="text-violet-500"
          label="In motion"
          value={counts.inMotion}
          accent="text-slate-800 dark:text-zinc-100"
        />

        {/* Divider */}
        <div className="w-px h-10 bg-slate-200 dark:bg-white/[0.06]" />

        <StatPill
          icon={OctagonAlert}
          iconBg={counts.blocked > 0 ? "bg-red-50 dark:bg-red-500/10" : "bg-slate-50 dark:bg-zinc-800"}
          iconColor={counts.blocked > 0 ? "text-red-500" : "text-slate-400 dark:text-zinc-500"}
          label="Blocked"
          value={counts.blocked}
          accent={counts.blocked > 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-zinc-100"}
        />
      </div>

      {/* Ambient glow line — only when tasks exist and something is in motion */}
      {counts.inMotion > 0 && (
        <div
          className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full"
          style={{
            background: "linear-gradient(90deg, #7C3AED 0%, #2DD4BF 50%, #7C3AED 100%)",
            opacity: 0.4,
          }}
        />
      )}
    </div>
  );
}
