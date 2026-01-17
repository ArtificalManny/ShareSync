// src/components/insights/InsightsBlock.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Hardcoded indigo/slate colors → Design tokens
// FIXED: Gradient text → Simple semantic colors
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from "react";
import { Lightbulb, TrendingUp, Clock, Flame } from "lucide-react";

export default function InsightsBlock({
  projectId,
  insights,
  loading: loadingProp,
  fetchInsights,
  className = "",
  max = 4,
}) {
  const [local, setLocal] = useState({ loading: false, data: [] });

  const loading = loadingProp ?? local.loading;
  const data = useMemo(() => {
    const arr = Array.isArray(insights) ? insights : local.data;
    return (arr || []).slice(0, max);
  }, [insights, local.data, max]);

  useEffect(() => {
    if (insights || loadingProp !== undefined) return;
    if (!projectId) return;

    let ignore = false;
    (async () => {
      try {
        setLocal((s) => ({ ...s, loading: true }));
        let fn = fetchInsights;
        if (!fn) {
          try {
            const mod = await import("../../api/stats");
            fn = mod.getProjectInsights || (async (pid) => {
              const res = await mod.getProjectStats(pid, { range: 30 });
              return res?.insights || [];
            });
          } catch {
            fn = async () => [];
          }
        }
        const out = await fn(projectId);
        if (!ignore) setLocal({ loading: false, data: out || [] });
      } catch {
        if (!ignore) setLocal({ loading: false, data: [] });
      }
    })();

    return () => { ignore = true; };
  }, [projectId, insights, loadingProp, fetchInsights]);

  /* ─────────────────────────────────────────────────────────────────────────
     LOADING STATE
  ───────────────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <section className={`rounded-xl border border-white/[0.06] bg-surface-1 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-surface-2 animate-pulse" />
          <h3 className="text-sm font-medium text-text-primary">Insights</h3>
        </div>
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 rounded bg-surface-2 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     EMPTY STATE
  ───────────────────────────────────────────────────────────────────────── */
  if (!data?.length) {
    return (
      <section className={`rounded-xl border border-white/[0.06] bg-surface-1 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-success" />
          <h3 className="text-sm font-medium text-text-primary">Insights</h3>
        </div>
        <p className="mt-2 text-sm text-text-tertiary">
          No insights yet. Keep working and we'll summarize patterns here.
        </p>
      </section>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     HELPER: Pick icon based on content
  ───────────────────────────────────────────────────────────────────────── */
  const pickIcon = (text) => {
    const t = (text || "").toLowerCase();
    if (t.includes("throughput") || t.includes("%") || t.includes("grew")) {
      return <TrendingUp className="w-3.5 h-3.5 text-success" />;
    }
    if (t.includes("afternoon") || t.includes("morning") || t.includes("peak")) {
      return <Clock className="w-3.5 h-3.5 text-info" />;
    }
    if (t.includes("streak")) {
      return <Flame className="w-3.5 h-3.5 text-warning" />;
    }
    return <Lightbulb className="w-3.5 h-3.5 text-brand" />;
  };

  /* ─────────────────────────────────────────────────────────────────────────
     DATA STATE
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <section className={`rounded-xl border border-white/[0.06] bg-surface-1 p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-success" />
        <h3 className="text-sm font-medium text-text-primary">Insights</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {data.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">{pickIcon(line)}</span>
            <span className="text-sm text-text-secondary">{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
