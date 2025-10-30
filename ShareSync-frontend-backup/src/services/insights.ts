/* Client-side insights generation.
   - Accepts recent KPI series and computes simple deltas
   - Can fetch stats from /api/projects/:id/stats?range=30 (fallback)
*/

type SeriesPoint = { t: number | string; v: number };
type Series = SeriesPoint[];

export type ProjectStats = {
  throughputPerWeek?: { value?: number; series?: Series };
  onTimeCompletion?: { value?: number; series?: Series };   // 0..1
  cadence?: { value?: number; series?: Series };
  activeDays?: { value?: number; series?: Series };
};

export type Insight = {
  id: string;
  title: string;
  text: string;
  severity: "low" | "med" | "high";
  metric?: string;
  delta?: number;     // relative change vs baseline (e.g., -0.2 = -20%)
  period?: string;    // e.g., "last 14d"
  suggestion?: string;
};

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function lastN(series?: Series, n = 7) {
  if (!Array.isArray(series)) return [];
  return series.slice(-n).map((p) => Number(p.v ?? 0));
}

function changePct(curr: number, base: number) {
  if (!isFinite(base) || Math.abs(base) < 1e-6) return 0;
  return (curr - base) / base;
}

export function computeInsights(stats: ProjectStats): Insight[] {
  const out: Insight[] = [];
  const tp = stats?.throughputPerWeek?.series;
  const ot = stats?.onTimeCompletion?.series;
  const cad = stats?.cadence?.series;

  // Throughput trend (last 7 vs prior 7)
  if (tp && tp.length >= 10) {
    const recent = lastN(tp, 7);
    const prior = lastN(tp.slice(0, -7), 7);
    const d = changePct(avg(recent), avg(prior));
    if (Math.abs(d) >= 0.2) {
      out.push({
        id: "throughput-trend",
        title: d < 0 ? "Throughput dipped" : "Throughput up",
        text:
          d < 0
            ? "Completed tasks per week dropped vs. the prior period."
            : "You’re completing more tasks per week than before.",
        severity: d < 0 ? "med" : "low",
        metric: "throughput",
        delta: d,
        period: "last 14d",
        suggestion:
          d < 0
            ? "Try a focus sprint with your top 3 tasks or rebalance assignments."
            : "Lock in the momentum with a 25:00 sprint on your highest-leverage task.",
      });
    }
  }

  // On-time completion (last 14 vs prior 14)
  if (ot && ot.length >= 20) {
    const recent = lastN(ot, 14);
    const prior = lastN(ot.slice(0, -14), 14);
    const d = changePct(avg(recent), avg(prior));
    if (Math.abs(d) >= 0.1) {
      out.push({
        id: "on-time-trend",
        title: d < 0 ? "On-time rate slipped" : "On-time rate improved",
        text:
          d < 0
            ? "A smaller share of tasks hit their due dates recently."
            : "More tasks are landing on time than before.",
        severity: d < 0 ? "high" : "low",
        metric: "on_time",
        delta: d,
        period: "last 28d",
        suggestion:
          d < 0
            ? "Audit near-due tasks and add due dates where missing. Consider tightening WIP limits."
            : "Great pace — keep due dates realistic and visible.",
      });
    }
  }

  // Cadence signal (activity bursts/slumps)
  if (cad && cad.length >= 10) {
    const recent = lastN(cad, 7);
    const prior = lastN(cad.slice(0, -7), 7);
    const d = changePct(avg(recent), avg(prior));
    if (Math.abs(d) >= 0.3) {
      out.push({
        id: "cadence-shift",
        title: d < 0 ? "Activity slowed" : "Activity spiked",
        text:
          d < 0
            ? "Fewer meaningful events than the prior week."
            : "Lots of events fired compared to the prior week.",
        severity: d < 0 ? "med" : "low",
        metric: "cadence",
        delta: d,
        period: "last 14d",
        suggestion:
          d < 0
            ? "Check for blockers or overlapping priorities. Consider a mid-week check-in."
            : "Capture learnings now: write a brief weekly summary while context is fresh.",
      });
    }
  }

  // If none triggered, give a generic nudge
  if (!out.length) {
    out.push({
      id: "generic-nudge",
      title: "Everything looks steady",
      text: "No strong signals popped this week. Keep momentum with small, visible wins.",
      severity: "low",
      suggestion: "Pick an outcome you can finish today and start a 25:00 focus sprint.",
    });
  }

  return out;
}

export async function fetchProjectStats(projectId: string): Promise<ProjectStats> {
  const res = await fetch(`/api/projects/${projectId}/stats?range=30`);
  if (!res.ok) throw new Error(`Stats fetch failed (${res.status})`);
  return res.json();
}

export async function getInsights(projectId: string): Promise<Insight[]> {
  const stats = await fetchProjectStats(projectId);
  return computeInsights(stats || {});
}
