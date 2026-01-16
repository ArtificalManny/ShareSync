// src/components/insights/InsightsDrawer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each insight has: 1) Title  2) Description  3) Severity indicator
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import Card, { CardBadge } from "../common/Card";
import { X, Lightbulb, Sparkles } from "lucide-react";
import { computeInsights, getInsights } from "../../services/insights";

/* ─────────────────────────────────────────────────────────────────────────
   INSIGHT ROW - 3 Element Rule Applied
───────────────────────────────────────────────────────────────────────── */
function InsightRow({ item, onApply }) {
  // Severity determines card variant
  const severityConfig = {
    high: { variant: 'highlight', badge: 'danger', status: 'danger' },
    med: { variant: 'elevated', badge: 'warning', status: 'warning' },
    low: { variant: 'ambient', badge: 'success', status: null },
  };
  
  const config = severityConfig[item.severity] || severityConfig.low;

  return (
    <Card 
      variant={config.variant}
      status={config.status}
      interactive={!!onApply}
      animated={!!onApply}
      padding="sm"
      className="group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Element 1: Title with icon */}
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-brand shrink-0" />
            <span className="text-sm font-medium text-text-primary truncate">
              {item.title}
            </span>
          </div>
          
          {/* Element 2: Description */}
          <p className="text-xs text-text-secondary line-clamp-2 ml-6">
            {item.text}
          </p>
          
          {/* Element 3: Delta (if present) */}
          {item.delta != null && (
            <div className="mt-2 ml-6">
              <CardBadge variant={item.delta < 0 ? 'danger' : 'success'}>
                {item.delta > 0 ? '+' : ''}{Math.round(item.delta * 100)}%
                {item.period && ` · ${item.period}`}
              </CardBadge>
            </div>
          )}
        </div>
        
        {/* Apply button */}
        {onApply && (
          <button
            type="button"
            onClick={() => onApply(item)}
            className="
              shrink-0 px-3 py-1.5 rounded-lg text-xs
              bg-surface-2 text-text-secondary
              hover:bg-surface-3 hover:text-text-primary
              transition-colors
            "
          >
            Apply
          </button>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────────────────── */
function InsightSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded bg-surface-3" />
        <div className="h-4 w-32 rounded bg-surface-3" />
      </div>
      <div className="h-3 w-full rounded bg-surface-3 ml-6" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN DRAWER
───────────────────────────────────────────────────────────────────────── */
export default function InsightsDrawer({
  open,
  onClose,
  projectId,
  insights: insightsProp,
  loading: loadingProp = false,
  onApply,
  stats,
}) {
  const [loading, setLoading] = useState(loadingProp);
  const [insights, setInsights] = useState(insightsProp || []);
  const [error, setError] = useState("");

  useEffect(() => { 
    if (Array.isArray(insightsProp)) setInsights(insightsProp); 
  }, [insightsProp]);
  
  useEffect(() => { 
    setLoading(loadingProp); 
  }, [loadingProp]);

  useEffect(() => {
    if (!open) return;

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <aside
        className="
          fixed right-0 top-0 z-50 h-full w-[min(400px,90vw)]
          bg-surface-0 border-l border-white/[0.06]
          shadow-2xl overflow-y-auto
        "
        role="dialog"
        aria-modal="true"
        aria-label="Insights"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">Insights</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Loading State */}
          {loading && (
            <>
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
            </>
          )}

          {/* Error State */}
          {!!error && !loading && (
            <Card variant="highlight" status="danger" padding="md">
              <p className="text-sm font-medium text-danger">Failed to load insights</p>
              <p className="text-xs text-text-tertiary mt-1">{error}</p>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && (!insights || insights.length === 0) && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-sm font-medium text-text-secondary">No signals yet</p>
              <p className="text-xs text-text-tertiary mt-1">
                We'll surface trends once there's more activity.
              </p>
            </div>
          )}

          {/* Insights List */}
          {!loading && !error && insights && insights.length > 0 && (
            <div className="space-y-2">
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
