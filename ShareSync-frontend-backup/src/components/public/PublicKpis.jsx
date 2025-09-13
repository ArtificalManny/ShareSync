import React from "react";

/**
 * PublicKpis
 *
 * Props:
 *  - items: Array<{ label: string, value: React.ReactNode, sub?: string }>
 *    (For convenience, you can pass numbers/strings for value; we render as-is.)
 */
export default function PublicKpis({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
        No KPIs available.
      </section>
    );
  }

  const Card = ({ label, value, sub }) => (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-4 shadow-sm">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl font-semibold text-text">{value}</div>
      {sub ? <div className="text-xs text-muted mt-1">{sub}</div> : null}
    </div>
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-sm font-semibold text-text">Key Metrics</div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((k, i) => (
          <Card key={`${k.label}-${i}`} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>
    </section>
  );
}
