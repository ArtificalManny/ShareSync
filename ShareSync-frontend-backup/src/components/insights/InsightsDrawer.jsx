import React, { useEffect, useMemo, useState, useCallback } from "react";
import SectionHeader from "../ui/SectionHeader.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Card from "../ui/Card.jsx";
import { X, Lightbulb, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { computeInsights, getInsights } from "../../services/insights";

function InsightRow({ item, onApply }) {
  const tone =
    item.severity === "high" ? "text-rose-600" :
    item.severity === "med"  ? "text-amber-600" :
    "text-emerald-600";

  return (
    <div className="rounded-xl border border-border bg-surface p-3 hover:bg-surface/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
            <div className="text-sm font-semibold">{item.title}</div>
          </div>
          <div className="mt-1 text-sm text-muted">{item.text}</div>
          {item.delta != null && (
            <div className="mt-1 text-xs">
              <span className="text-muted">Change: </span>
              <span className={item.delta < 0 ? "text-rose-600" : "text-emerald-600"}>
                {item.delta > 0 ? "+" : ""}{Math.round(item.delta * 100)}%
              </span>
              {item.period ? <span className="text-muted"> · {item.period}</span> : null}
            </div>
          )}
          {item.suggestion && (
            <div className="mt-2 text-xs rounded-lg border border-dashed border-border px-2 py-1">
              {item.suggestion}
            </div>
          )}
        </div>
        <div className="shrink-0">
          {onApply && (
            <button
              type="button"
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-surface"
              onClick={() => onApply(item)}
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsightsDrawer({
  open,
  onClose,
  projectId,
  insights: insightsProp,
  loading: loadingProp = false,
  onApply,           // optional handler: (insight) => { … } e.g., open task sheet / draft actions
  stats,             // optional project stats; if provided, compute client-side without fetch
}) {
  const [loading, setLoading] = useState(loadingProp);
  const [insights, setInsights] = useState(insightsProp || []);
  const [error, setError] = useState("");

  // keep external prop in sync
  useEffect(() => { if (Array.isArray(insightsProp)) setInsights(insightsProp); }, [insightsProp]);
  useEffect(() => { setLoading(loadingProp); }, [loadingProp]);

  useEffect(() => {
    if (!open) return;

    // If stats provided, compute immediately
    if (stats && !insightsProp) {
      try {
        setInsights(computeInsights(stats));
      } catch (e) {
        setError(e?.message || "Failed to compute insights.");
      }
      return;
    }

    if (!projectId || insightsProp) return;

    setLoading(true);
    setError("");
    getInsights(projectId)
      .then((rows) => setInsights(rows || []))
      .catch((e) => setError(e?.message || "Failed to load insights."))
      .finally(() => setLoading(false));
  }, [open, projectId, stats, insightsProp]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 h-full w-[min(440px,90vw)] bg-surface border-l border-border shadow-xl px-4 py-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Insights"
      >
        <div className="flex items-center justify-between">
          <SectionHeader icon="Sparkles">Insights</SectionHeader>
          <button
            className="rounded-lg p-2 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {loading && (
            <>
              <div className="h-[72px] rounded-xl border border-border bg-surface animate-pulse" />
              <div className="h-[72px] rounded-xl border border-border bg-surface animate-pulse" />
              <div className="h-[72px] rounded-xl border border-border bg-surface animate-pulse" />
            </>
          )}

          {!!error && !loading && (
            <Card className="border-rose-200/60">
              <div className="text-rose-600">Failed to load insights</div>
              <div className="text-sm text-muted">{error}</div>
            </Card>
          )}

          {!loading && !error && (!insights || insights.length === 0) && (
            <EmptyState
              icon="🧠"
              title="No signals yet"
              subtitle="We’ll surface trends once there’s a bit more activity."
            />
          )}

          {!loading && !error && insights && insights.length > 0 && (
            <div className="space-y-3">
              {insights.map((ins) => (
                <InsightRow key={ins.id || ins.title} item={ins} onApply={onApply} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
