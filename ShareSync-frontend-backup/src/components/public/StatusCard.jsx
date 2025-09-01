// /src/components/public/StatusCard.jsx
import React from "react";
import { Clock, UserRound } from "lucide-react";

function fmtPct(v) {
  if (v == null || isNaN(v)) return "—";
  const pct = Math.max(0, Math.min(1, Number(v)));
  return `${Math.round(pct * 100)}%`;
}

function fmtInt(v) {
  if (v == null || isNaN(v)) return "—";
  return String(Math.round(Number(v)));
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return "—";
  }
}

function Kpi({ label, value, sub, emphasis = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm bg-white/95 dark:bg-slate-900/90 
      border-slate-200/70 dark:border-slate-700 ${emphasis ? "ring-1 ring-indigo-200 dark:ring-indigo-900/40" : ""}`}
      role="group"
      aria-label={label}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
      {sub ? <div className="text-[11px] text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}

export default function StatusCard({ title, owner, lastUpdatedAt, kpis = {}, summary }) {
  const ownerName = owner?.name || "Unknown";
  const avatarUrl = owner?.avatarUrl;

  return (
    <section
      className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/85 p-6 shadow-sm"
      aria-label="Public project status"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {title || "Untitled Project"}
          </h2>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
              )}
              <span className="truncate" title={ownerName}>
                {ownerName}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span className="truncate">Updated {fmtDate(lastUpdatedAt)}</span>
            </span>
          </div>
          {summary ? (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {summary}
            </p>
          ) : null}
        </div>
      </header>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          label="On-time (30d)"
          value={fmtPct(kpis.onTime30d)}
          sub="Deadlines met"
          emphasis
        />
        <Kpi
          label="Throughput / wk"
          value={fmtInt(kpis.throughputPerWeek)}
          sub="Completed tasks / 7d"
        />
        <Kpi
          label="Active Days (28d)"
          value={fmtInt(kpis.activeDays28d)}
          sub="Days with updates"
        />
        <Kpi
          label="Cadence (14d)"
          value={fmtInt(kpis.cadence14d)}
          sub="Recency-weighted"
        />
      </div>

      {/* Footer: transparency note */}
      <div className="mt-4 text-[11px] text-slate-500">
        Transparent snapshot — activity & KPIs reflect recent history; sensitive details are omitted.
      </div>
    </section>
  );
}
