import React, { useMemo } from "react";
import { Sparkles, AlertTriangle, ArrowRight, Gauge } from "lucide-react";

function normalizeRiskLabel(risk) {
  if (!risk) return "Risk";
  if (typeof risk === "string") return risk;
  return risk.summary || risk.label || risk.title || risk.message || "Risk";
}

function normalizeRecommendation(risk) {
  if (!risk || typeof risk === "string") return "";
  return risk.recommendation || risk.action || "";
}

export default function ForesightCard({ metrics, overview, loading }) {
  const foresight = useMemo(() => {
    return metrics?.foresight || overview?.foresight || null;
  }, [metrics, overview]);

  const risks = useMemo(() => {
    if (Array.isArray(foresight?.risks) && foresight.risks.length > 0) {
      return foresight.risks;
    }
    if (Array.isArray(metrics?.risks) && metrics.risks.length > 0) {
      return metrics.risks;
    }
    if (Array.isArray(overview?.risks) && overview.risks.length > 0) {
      return overview.risks;
    }
    return [];
  }, [foresight, metrics, overview]);

  const nextAction =
    foresight?.nextAction ||
    metrics?.nextAction ||
    overview?.nextAction ||
    "";

  const summary =
    foresight?.summary ||
    foresight?.message ||
    "";

  const recommendation =
    foresight?.recommendation ||
    (Array.isArray(risks) && risks.length > 0
      ? normalizeRecommendation(risks[0])
      : "");

  const confidence =
    typeof foresight?.confidence === "number"
      ? Math.max(0, Math.min(100, Math.round(foresight.confidence * (foresight.confidence <= 1 ? 100 : 1))))
      : null;

  const isEmpty = !summary && !nextAction && risks.length === 0;

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Foresight</h3>
        </div>

        <div className="flex items-center gap-2">
          {confidence !== null ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
              <Gauge className="w-3 h-3" />
              {confidence}% confidence
            </span>
          ) : null}

          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {loading ? "Loading…" : "AI"}
          </span>
        </div>
      </header>

      {isEmpty ? (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 mx-auto mb-3 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            AI predictions unlock after stronger project signals appear.
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Keep shipping — patterns emerge fast.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {summary ? (
            <div className="rounded-xl border border-amber-100 dark:border-amber-500/15 bg-amber-50/50 dark:bg-amber-500/5 px-3 py-3">
              <div className="text-xs text-slate-400 dark:text-zinc-500 mb-1">Prediction</div>
              <div className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed">
                {summary}
              </div>
            </div>
          ) : null}

          {nextAction ? (
            <div>
              <div className="text-xs text-slate-400 dark:text-zinc-500 mb-1">Suggested next</div>
              <div className="inline-flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-200">
                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  {typeof nextAction === "string"
                    ? nextAction
                    : nextAction?.title || nextAction?.label || nextAction?.text || "Recommended next move"}
                </span>
              </div>
            </div>
          ) : null}

          {recommendation ? (
            <div>
              <div className="text-xs text-slate-400 dark:text-zinc-500 mb-1">Recommendation</div>
              <div className="text-sm text-slate-700 dark:text-zinc-200">
                {recommendation}
              </div>
            </div>
          ) : null}

          {Array.isArray(risks) && risks.length > 0 ? (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
              <div className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Risks
              </div>

              {risks.slice(0, 3).map((risk, i) => (
                <div key={i} className="rounded-lg bg-slate-50 dark:bg-white/[0.03] px-3 py-2">
                  <div className="text-xs text-slate-700 dark:text-zinc-200">
                    {normalizeRiskLabel(risk)}
                  </div>
                  {normalizeRecommendation(risk) ? (
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      {normalizeRecommendation(risk)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
