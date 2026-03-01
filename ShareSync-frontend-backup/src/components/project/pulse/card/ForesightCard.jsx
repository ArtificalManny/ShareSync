import React from "react";

export default function ForesightCard({ metrics, overview, loading }) {
  const risks = metrics?.risks || overview?.foresight?.risks || overview?.risks || [];
  const next =
    metrics?.nextAction ||
    metrics?.foresight?.nextAction ||
    overview?.foresight?.nextAction ||
    overview?.nextAction;

  return (
    <section className="glass-card p-4">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold opacity-90">Foresight</h3>
        <span className="text-xs opacity-60">{loading ? "Loading…" : "AI"}</span>
      </header>

      <div className="text-sm opacity-80">
        {next ? (
          <div>
            <div className="text-xs opacity-60 mb-1">Suggested next action</div>
            <div className="opacity-90">{next}</div>
          </div>
        ) : (
          <div className="opacity-70">AI predictions unlock after 7 days of activity.</div>
        )}

        {Array.isArray(risks) && risks.length > 0 && (
          <ul className="mt-3 text-xs opacity-70 list-disc pl-4">
            {risks.slice(0, 3).map((r, i) => (
              <li key={i}>{typeof r === "string" ? r : r?.label || r?.title || "Risk"}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
