// src/components/analytics/KpiRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each KPI has: 1) Label  2) Value  3) Color accent (semantic)
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Info } from "lucide-react";
import Card from "../common/Card";

/* ─────────────────────────────────────────────────────────────────────────
   KPI CHIP - Simplified with Design Tokens
───────────────────────────────────────────────────────────────────────── */
function Kpi({ label, value, suffix, help, tone = "brand" }) {
  // Simplified tone system using design tokens
  const tones = {
    brand: {
      accent: "bg-brand",
      bg: "bg-brand/5",
      border: "border-brand/20",
    },
    success: {
      accent: "bg-success",
      bg: "bg-success/5",
      border: "border-success/20",
    },
    warning: {
      accent: "bg-warning",
      bg: "bg-warning/5",
      border: "border-warning/20",
    },
    info: {
      accent: "bg-blue-500",
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
    },
  };

  const t = tones[tone] || tones.brand;

  return (
    <div className={`
      relative rounded-xl p-4
      ${t.bg} border ${t.border}
      transition-colors
    `}>
      {/* Left accent bar */}
      <div
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-1 ${t.accent} rounded-l-xl`}
      />

      <div className="flex items-center justify-between gap-3">
        {/* Element 1: Label */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-text-secondary">{label}</span>
          {help && (
            <span title={help} aria-label={help} className="text-text-tertiary cursor-help">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )}
        </div>

        {/* Element 2: Value */}
        <div className="text-lg font-semibold tabular-nums text-text-primary shrink-0">
          {value}
          {suffix && (
            <span className="ml-1 text-xs text-text-tertiary font-normal">{suffix}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   KPI ROW - Container
───────────────────────────────────────────────────────────────────────── */
export default function KpiRow({ cadence, onTimeCompletion, activeDays, throughputPerWeek }) {
  return (
    <Card variant="ambient" padding="md" className="mt-6" role="region" aria-label="KPI metrics">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi
          tone="brand"
          label="Cadence"
          value={cadence?.value ?? 0}
          suffix={`/ ${cadence?.windowDays ?? 14}d`}
          help="Updates + completed tasks over 14 days"
        />
        <Kpi
          tone="success"
          label="On-time"
          value={
            typeof onTimeCompletion?.value === "number"
              ? `${Math.round(onTimeCompletion.value * 100)}%`
              : "0%"
          }
          suffix={`/ ${onTimeCompletion?.windowDays ?? 30}d`}
          help="Tasks completed by due date"
        />
        <Kpi
          tone="info"
          label="Active days"
          value={activeDays?.value ?? 0}
          suffix={`/ ${activeDays?.windowDays ?? 28}d`}
          help="Days with activity"
        />
        <Kpi
          tone="warning"
          label="Throughput"
          value={throughputPerWeek?.value ?? 0}
          suffix="/wk"
          help="Completed tasks per week"
        />
      </div>
    </Card>
  );
}
