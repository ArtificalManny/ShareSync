// src/components/home/TeamBalancePanel.jsx
import React from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

function PersonAvatar({ member }) {
  const initial = String(member?.name || "?").trim().charAt(0).toUpperCase() || "?";
  const isHeavy = Number(member?.loadPercent ?? member?.load ?? 0) >= 50;

  if (member?.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.name || "Member"}
        className="w-8 h-8 rounded-full object-cover border border-white/80 shadow-sm"
      />
    );
  }

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors duration-500 shadow-sm ${
        isHeavy
          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500"
          : "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-500"
      }`}
    >
      {initial}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-white/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-28 bg-slate-200/70 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-2 w-20 bg-slate-200/70 dark:bg-white/10 rounded animate-pulse" />
            </div>
          </div>

          <div className="h-4 w-8 bg-slate-200/70 dark:bg-white/10 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function TeamBalancePanel({
  workload = null,
  loading = false,
  error = "",
  onRefresh,
}) {
  const team = Array.isArray(workload?.personnel) ? workload.personnel : [];
  const isBalanced = Boolean(workload?.isBalanced);
  const hasTeam = Boolean(workload?.hasTeam);
  const isHighWorkload = Boolean(workload?.isHighWorkload);

  const diagnosticTitle = loading
    ? "Reading Workload"
    : error
      ? "Workload Offline"
      : workload?.diagnosticTitle || "Workload Intelligence";

  const diagnosticDescription = loading
    ? "Calculating active personnel from your current project data."
    : error
      ? "OpenShare could not refresh workload intelligence. Try refreshing once the backend is running."
      : workload?.diagnosticDescription || "No workload signal has been calculated yet.";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div
        className={`p-4 rounded-xl transition-all shadow-sm border ${
          error
            ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
            : isBalanced
              ? "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20"
              : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
        }`}
      >
        <div className="flex gap-3 items-start">
          {loading ? (
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin mt-0.5" />
          ) : error ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5" />
          ) : isBalanced ? (
            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
          )}

          <div>
            <h4
              className={`text-sm font-black uppercase tracking-tight ${
                error
                  ? "text-rose-900 dark:text-rose-100"
                  : isBalanced
                    ? "text-teal-900 dark:text-teal-100"
                    : "text-amber-900 dark:text-amber-100"
              }`}
            >
              {diagnosticTitle}
            </h4>

            <p
              className={`text-xs mt-1 leading-relaxed font-medium ${
                error
                  ? "text-rose-700 dark:text-rose-300"
                  : isBalanced
                    ? "text-teal-700 dark:text-teal-300"
                    : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {diagnosticDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex justify-between">
          Active Personnel
          {loading && (
            <span className="text-[var(--theme-accent-primary)] animate-pulse">
              Syncing Nodes...
            </span>
          )}
        </h5>

        {loading ? (
          <LoadingRows />
        ) : team.length > 0 ? (
          team.map((member) => {
            const load = Number(member?.loadPercent ?? member?.load ?? 0);
            const ships = Number(member?.shipsCompleted ?? member?.ships ?? 0);
            const isCurrentUser = Boolean(member?.isCurrentUser);

            return (
              <div
                key={member.id || member.userId || member.name}
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <PersonAvatar member={member} />

                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
                      {member.name || "Project member"}
                      {isCurrentUser ? " (You)" : ""}
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider transition-all">
                      {ships} {ships === 1 ? "Ship" : "Ships"} Completed
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-black italic transition-colors duration-500 ${
                      load >= 50
                        ? "text-amber-600 dark:text-amber-500"
                        : "text-teal-600 dark:text-teal-400"
                    }`}
                  >
                    {load}%
                  </div>

                  <div className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    Load
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-center">
            <Users className="w-5 h-5 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
              No active personnel signal yet
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Complete tasks or ship updates to generate workload intelligence.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
          loading
            ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border border-slate-200 dark:border-white/10"
            : isHighWorkload
              ? "bg-[var(--theme-accent-primary)] text-white hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 border border-transparent"
              : "border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Refreshing Workload...
          </>
        ) : isHighWorkload && hasTeam ? (
          <>
            <ArrowRightLeft className="w-4 h-4" />
            Refresh Workload Data
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Refresh Workload Data
          </>
        )}
      </button>
    </div>
  );
}
