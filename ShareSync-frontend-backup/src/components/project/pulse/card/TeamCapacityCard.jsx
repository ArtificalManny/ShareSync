import React, { useMemo } from "react";
import { Users, Gauge, ShieldAlert } from "lucide-react";

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function getLoadTone(loadPercent) {
  if (loadPercent >= 85) {
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500",
      pill: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
      label: "Overloaded",
    };
  }

  if (loadPercent >= 65) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500",
      pill: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      label: "Busy",
    };
  }

  return {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500",
    pill: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    label: "Balanced",
  };
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400 font-medium mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

export default function TeamCapacityCard({ metrics }) {
  const rawTeamCapacity = metrics?.teamCapacity ?? metrics?.capacity ?? null;

  const structuredRows = useMemo(() => {
    if (!Array.isArray(rawTeamCapacity)) return [];

    return rawTeamCapacity
      .filter((row) => row && typeof row === "object" && !Array.isArray(row))
      .map((row) => {
        const capacity = safeNumber(row?.capacity, 100);
        const load = safeNumber(row?.load, 0);
        const loadPercent =
          capacity > 0 ? Math.max(0, Math.min(100, Math.round((load / capacity) * 100))) : 0;

        return {
          userId: row?.userId || row?.id || "",
          name: row?.name || "Member",
          capacity,
          load,
          loadPercent,
          assignedCount: safeNumber(row?.assignedCount, 0),
          blockedCount: safeNumber(row?.blockedCount, 0),
        };
      });
  }, [rawTeamCapacity]);

  const legacyCapacity =
    !Array.isArray(rawTeamCapacity) && rawTeamCapacity !== null
      ? rawTeamCapacity
      : metrics?.capacity ?? null;

  const legacyLoad = metrics?.teamLoad ?? metrics?.load ?? null;
  const legacyMemberCount = metrics?.memberCount ?? metrics?.teamSize ?? null;

  const hasStructuredData = structuredRows.length > 0;
  const hasLegacyData = legacyCapacity !== null || legacyLoad !== null || legacyMemberCount !== null;

  const summary = useMemo(() => {
    if (!hasStructuredData) return null;

    const memberCount = structuredRows.length;
    const totalCapacity = structuredRows.reduce((sum, row) => sum + row.capacity, 0);
    const totalLoad = structuredRows.reduce((sum, row) => sum + row.load, 0);
    const totalAssigned = structuredRows.reduce((sum, row) => sum + row.assignedCount, 0);
    const totalBlocked = structuredRows.reduce((sum, row) => sum + row.blockedCount, 0);
    const avgLoadPercent =
      totalCapacity > 0 ? Math.max(0, Math.min(100, Math.round((totalLoad / totalCapacity) * 100))) : 0;
    const overloadedCount = structuredRows.filter((row) => row.loadPercent >= 85).length;

    return {
      memberCount,
      totalAssigned,
      totalBlocked,
      avgLoadPercent,
      overloadedCount,
    };
  }, [hasStructuredData, structuredRows]);

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            Team Capacity
          </h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Live</span>
      </header>

      {hasStructuredData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricPill label="Members" value={summary.memberCount} />
            <MetricPill label="Avg load" value={`${summary.avgLoadPercent}%`} />
            <MetricPill label="Assigned" value={summary.totalAssigned} />
            <MetricPill label="Blocked" value={summary.totalBlocked} />
          </div>

          <div className="space-y-3">
            {structuredRows.slice(0, 5).map((row) => {
              const tone = getLoadTone(row.loadPercent);

              return (
                <div
                  key={row.userId || row.name}
                  className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 p-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-semibold shrink-0">
                        {getInitials(row.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
                          {row.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400">
                          {row.assignedCount} assigned
                          {row.blockedCount > 0 ? ` · ${row.blockedCount} blocked` : ""}
                        </div>
                      </div>
                    </div>

                    <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.pill}`}>
                      {tone.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>
                        Load {row.load}/{row.capacity}
                      </span>
                    </div>

                    <div className={`text-xs font-semibold ${tone.text}`}>
                      {row.loadPercent}%
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tone.bg}`}
                      style={{ width: `${row.loadPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {summary.overloadedCount > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                {summary.overloadedCount} team member{summary.overloadedCount === 1 ? "" : "s"} near capacity.
              </div>
            </div>
          ) : null}
        </div>
      ) : hasLegacyData ? (
        <div className="space-y-3">
          {legacyCapacity !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Capacity</span>
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                {legacyCapacity}
              </span>
            </div>
          )}

          {legacyLoad !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Load</span>
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                {legacyLoad}
              </span>
            </div>
          )}

          {legacyMemberCount !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Members</span>
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                {legacyMemberCount}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-500/10 mx-auto mb-3 flex items-center justify-center">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            Team workload metrics unlock with 2+ members.
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Invite someone to see capacity insights.
          </p>
        </div>
      )}
    </section>
  );
}
