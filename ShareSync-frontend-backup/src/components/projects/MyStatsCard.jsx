// src/components/projects/MyStatsCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// 1) Title  2) Chart  3) (implicit) day labels
// ═══════════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import Card from "../common/Card";

/* ─────────────────────────────────────────────────────────────────────────
   MINI CHART
───────────────────────────────────────────────────────────────────────── */
function Chart({ labels, values }) {
  const max = useMemo(() => Math.max(1, ...values), [values]);
  
  return (
    <div
      role="img"
      aria-label="Weekly activity chart"
      className="grid grid-cols-7 gap-1.5 items-end h-16"
    >
      {values.map((v, i) => {
        const h = Math.round((v / max) * 100);
        const isHighest = v === max && v > 0;
        
        return (
          <div key={labels[i]} className="flex flex-col items-center">
            <div
              className={`
                w-full max-w-[24px] rounded-md transition-all
                ${isHighest ? 'bg-brand' : 'bg-brand/40'}
              `}
              style={{ height: `${Math.max(8, h)}%` }}
              aria-hidden="true"
            />
            <span className="mt-1.5 text-[10px] text-text-tertiary">
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const MemoChart = memo(Chart);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
function MyStatsCardBase({ stats }) {
  const data = useMemo(
    () =>
      stats || {
        labels: ["M", "T", "W", "T", "F", "S", "S"],
        values: [3, 4, 6, 5, 7, 2, 1],
      },
    [stats]
  );

  return (
    <Card 
      variant="ambient" 
      padding="md"
      as="section"
      aria-labelledby="mystats-title"
      role="region"
    >
      <h3 
        id="mystats-title" 
        className="text-sm font-medium text-text-secondary mb-4"
      >
        My Stats
      </h3>
      <MemoChart labels={data.labels} values={data.values} />
    </Card>
  );
}

export default memo(MyStatsCardBase);
