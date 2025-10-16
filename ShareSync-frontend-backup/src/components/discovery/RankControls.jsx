import React from "react";
import { useSearchParams } from "react-router-dom";

export default function RankControls() {
  const [sp, setSp] = useSearchParams();
  const w1 = clampNum(sp.get("w1"), 0.6, 0, 1);
  const w2 = clampNum(sp.get("w2"), 0.3, 0, 1 - w1);
  const hl = clampNum(sp.get("hl"), 24, 6, 168);

  const update = (next) => setSp({ w1: fmt(next.w1 ?? w1), w2: fmt(next.w2 ?? w2), hl: fmt(next.hl ?? hl) });

  return (
    <div className="mb-3 rounded-xl border border-border bg-surface p-3 flex flex-wrap items-center gap-4">
      <Control label={`Velocity weight (${w1})`}>
        <input type="range" min="0" max="1" step="0.05" value={w1}
          onChange={(e) => {
            const nv = clampNum(e.target.value, 0.6, 0, 1);
            const maxW2 = Math.max(0, 1 - nv);
            update({ w1: nv, w2: Math.min(w2, maxW2) });
          }} />
      </Control>
      <Control label={`Reactions weight (${w2})`}>
        <input type="range" min="0" max={Math.max(0, 1 - w1)} step="0.05" value={w2}
          onChange={(e) => update({ w2: clampNum(e.target.value, 0.3, 0, 1 - w1) })} />
      </Control>
      <Control label={`Freshness half-life (hrs)`}>
        <input type="number" min="6" max="168" value={hl}
          onChange={(e) => update({ hl: clampNum(e.target.value, 24, 6, 168) })} className="w-20 text-sm rounded border px-2 py-1" />
      </Control>
      <div className="text-xs text-muted">Weights must sum ≤ 1; leftover goes to freshness.</div>
    </div>
  );
}
function Control({ label, children }) {
  return (
    <label className="text-sm flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
function clampNum(v, def, min, max) {
  const n = Number(v); if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}
function fmt(n) { return Number(n).toFixed(2); }
