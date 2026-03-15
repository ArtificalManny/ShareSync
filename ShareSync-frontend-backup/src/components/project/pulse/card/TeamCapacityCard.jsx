import React from "react";
import { Users } from "lucide-react";

export default function TeamCapacityCard({ metrics }) {
  const capacity = metrics?.teamCapacity ?? metrics?.capacity ?? null;
  const load = metrics?.teamLoad ?? metrics?.load ?? null;
  const memberCount = metrics?.memberCount ?? metrics?.teamSize ?? null;

  const hasData = capacity !== null || load !== null;

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Team Capacity</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Live</span>
      </header>

      {hasData ? (
        <div className="space-y-3">
          {capacity !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Capacity</span>
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{capacity}</span>
            </div>
          )}
          {load !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Load</span>
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{load}</span>
            </div>
          )}
          {memberCount !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Members</span>
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{memberCount}</span>
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
