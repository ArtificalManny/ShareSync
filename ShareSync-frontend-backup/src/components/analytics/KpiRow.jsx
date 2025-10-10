import React from "react";
import { Info } from "lucide-react";
import Card from "../ui/Card.jsx";

/**
 * Kpi chip w/ pastel tone, dot, and accessible tooltip
 */
function Kpi({ label, value, suffix, help, tone = "indigo" }) {
  const tones = {
    indigo:  {
      shell: "bg-white dark:bg-slate-900 border-indigo-200/70 dark:border-indigo-400/20",
      dot:   "bg-indigo-500",
      ring:  "ring-indigo-200/60 dark:ring-indigo-400/20",
      grad:  "from-indigo-50 via-white to-indigo-50 dark:from-indigo-900/20 dark:via-slate-900 dark:to-indigo-900/10",
      text:  "text-slate-800 dark:text-slate-100",
      sub:   "text-slate-500 dark:text-slate-400",
    },
    sky:    {
      shell: "bg-white dark:bg-slate-900 border-sky-200/70 dark:border-sky-400/20",
      dot:   "bg-sky-500",
      ring:  "ring-sky-200/60 dark:ring-sky-400/20",
      grad:  "from-sky-50 via-white to-sky-50 dark:from-sky-900/20 dark:via-slate-900 dark:to-sky-900/10",
      text:  "text-slate-800 dark:text-slate-100",
      sub:   "text-slate-500 dark:text-slate-400",
    },
    amber:  {
      shell: "bg-white dark:bg-slate-900 border-amber-200/70 dark:border-amber-400/20",
      dot:   "bg-amber-500",
      ring:  "ring-amber-200/60 dark:ring-amber-400/20",
      grad:  "from-amber-50 via-white to-amber-50 dark:from-amber-900/20 dark:via-slate-900 dark:to-amber-900/10",
      text:  "text-slate-800 dark:text-slate-100",
      sub:   "text-slate-500 dark:text-slate-400",
    },
    emerald:{
      shell: "bg-white dark:bg-slate-900 border-emerald-200/70 dark:border-emerald-400/20",
      dot:   "bg-emerald-500",
      ring:  "ring-emerald-200/60 dark:ring-emerald-400/20",
      grad:  "from-emerald-50 via-white to-emerald-50 dark:from-emerald-900/20 dark:via-slate-900 dark:to-emerald-900/10",
      text:  "text-slate-800 dark:text-slate-100",
      sub:   "text-slate-500 dark:text-slate-400",
    },
  }[tone];

  return (
    <div
      className={[
        "relative rounded-2xl px-4 py-3",
        "border shadow-sm ring-1", tones.ring, tones.shell,
        "bg-gradient-to-br", tones.grad,
      ].join(" ")}
    >
      {/* left accent bar */}
      <div
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-1 ${tones.dot} rounded-l-2xl`}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-1.5 w-1.5 rounded-full ${tones.dot}`} aria-hidden="true" />
          <span className={`text-sm font-medium ${tones.text}`}>{label}</span>
          {help ? (
            <span title={help} aria-label={help} className={`${tones.sub}`}>
              <Info className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
            </span>
          ) : null}
        </div>

        <div className={`text-lg font-semibold tabular-nums num ${tones.text} shrink-0`}>
  {value}
  {suffix ? (
    <span className={`ml-1 text-sm ${tones.sub}`}>{suffix}</span>
  ) : null}
</div>
      </div>
    </div>
  );
}

/**
 * Props:
 *  - cadence { value, windowDays }
 *  - onTimeCompletion { value (0..1), windowDays }
 *  - activeDays { value, windowDays }
 *  - throughputPerWeek { value, windowDays }
 */
export default function KpiRow({ cadence, onTimeCompletion, activeDays, throughputPerWeek }) {
  const pct =
    typeof onTimeCompletion?.value === "number"
      ? Math.round(onTimeCompletion.value * 100)
      : 0;

      return (
        <Card className="mt-6" role="region" aria-label="KPI Row">
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Kpi
              tone="indigo"
              label="Cadence"
              value={cadence?.value ?? 0}
              suffix={`/ ${cadence?.windowDays ?? 14}d`}
              help="Updates + completed tasks, recency-weighted over a rolling 14 days."
            />
            <Kpi
              tone="emerald"
              label="On-time"
              value={
                typeof onTimeCompletion?.value === "number"
                  ? `${Math.round(onTimeCompletion.value * 100)}%`
                  : "0%"
              }
              suffix={`/${onTimeCompletion?.windowDays ?? 30}d`}
              help="Share of tasks completed by due date over 30 days."
            />
            <Kpi
              tone="sky"
              label="Active days"
              value={activeDays?.value ?? 0}
              suffix={`/${activeDays?.windowDays ?? 28}d`}
              help="Days with any activity in the last 28 days."
            />
            <Kpi
              tone="amber"
              label="Throughput"
              value={throughputPerWeek?.value ?? 0}
              suffix={`/wk`}
              help="Completed tasks per 7-day window."
            />
          </div>
        </Card>
      );
    }      
