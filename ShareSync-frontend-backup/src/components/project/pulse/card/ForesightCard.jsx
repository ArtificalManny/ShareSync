import React from "react";
import { Sparkles, AlertTriangle } from "lucide-react";

export default function ForesightCard({ metrics, overview, loading }) {
  const risks = metrics?.risks || overview?.foresight?.risks || overview?.risks || [];
  const next =
    metrics?.nextAction ||
    metrics?.foresight?.nextAction ||
    overview?.foresight?.nextAction ||
    overview?.nextAction;

  const isEmpty = !next && risks.length === 0;

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Foresight</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">
          {loading ? "Loading…" : "AI"}
        </span>
      </header>

      {isEmpty ? (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 mx-auto mb-3 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            AI predictions unlock after 7 days of activity.
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Keep shipping — patterns emerge fast.
          </p>
        </div>
      ) : (
        <div>
          {next && (
            <div className="mb-3">
              <div className="text-xs text-slate-400 dark:text-zinc-500 mb-1">Suggested next</div>
              <div className="text-sm text-slate-700 dark:text-zinc-200">{next}</div>
            </div>
          )}

          {Array.isArray(risks) && risks.length > 0 && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
              <div className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Risks
              </div>
              {risks.slice(0, 3).map((r, i) => (
                <div key={i} className="text-xs text-slate-600 dark:text-zinc-300 pl-4">
                  {typeof r === "string" ? r : r?.label || r?.title || "Risk"}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
