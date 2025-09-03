// /src/components/insights/InsightsBlock.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Lightbulb, TrendingUp, Clock, Flame } from "lucide-react";

// Optional: pass `fetchInsights` if you want custom fetching.
// Otherwise it will try `import('../../api/stats').then(m => m.getProjectInsights)`
export default function InsightsBlock({
  projectId,
  insights,              // optional pre-fetched array of strings
  loading: loadingProp,  // optional external loading flag
  fetchInsights,         // optional: async (projectId) => string[]
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
    if (insights || loadingProp !== undefined) return; // controlled externally
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

  if (loading) {
    return (
      <section className={`card rounded-2xl border border-border bg-surface p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-indigo-100 animate-pulse" />
          <h3 className="text-sm font-semibold text-text">Insights</h3>
        </div>
        <div className="mt-3 space-y-2">
          {[0,1,2].map((i) => (
            <div key={i} className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!data?.length) {
    return (
      <section className={`card rounded-2xl border border-border bg-surface p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-text">Insights</h3>
        </div>
        <p className="mt-2 text-sm text-muted">No insights yet. Keep working and we’ll summarize patterns here.</p>
      </section>
    );
  }

  // Tiny helper to decorate some common patterns
  const pickIcon = (text) => {
    const t = (text || "").toLowerCase();
    if (t.includes("throughput") || t.includes("%") || t.includes("grew")) return <TrendingUp className="w-4 h-4" />;
    if (t.includes("afternoon") || t.includes("morning") || t.includes("peak")) return <Clock className="w-4 h-4" />;
    if (t.includes("streak")) return <Flame className="w-4 h-4" />;
    return <Lightbulb className="w-4 h-4" />;
  };

  return (
    <section className={`card rounded-2xl border border-border bg-surface p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-text">Insights</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {data.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[3px] text-indigo-600">{pickIcon(line)}</span>
            <span className="text-sm text-text">{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
