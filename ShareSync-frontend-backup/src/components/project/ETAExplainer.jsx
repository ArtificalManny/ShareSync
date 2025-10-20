import React, { useMemo, useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import Card from "../ui/Card.jsx";
import { track } from "../../utils/telemetry";

/**
 * ETAExplainer
 * Compact card that shows ETA to the next milestone and *why*.
 *
 * Props:
 * - eta: Date | string | number  // when you expect completion
 * - confidence: number           // 0..1 (or 0..100); shown as %
 * - reasons: string[]            // bullets explaining the estimate
 * - samples?: Array<{label: string, medianDays: number}> // “similar tasks” sample
 * - project?: { id: string, name: string }
 * - onOpen?: () => void
 *
 * Renders a graceful placeholder if data is missing.
 */
export default function ETAExplainer({
  eta,
  confidence,
  reasons = [],
  samples = [],
  project,
  onOpen,
}) {
  const [open, setOpen] = useState(false);

  const etaText = useMemo(() => {
    if (!eta) return "—";
    try {
      const d = new Date(eta);
      const opts = { weekday: "short", hour: "numeric", minute: "2-digit" };
      // If not within 7 days, include month/day
      const now = new Date();
      const in7d = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
      const fmt =
        d <= in7d
          ? new Intl.DateTimeFormat(undefined, opts)
          : new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });
      return fmt.format(d);
    } catch {
      return String(eta);
    }
  }, [eta]);

  const pct =
    typeof confidence === "number"
      ? Math.round(confidence <= 1 ? confidence * 100 : confidence)
      : undefined;

  const toggle = () => {
    if (!open) {
      track("eta_explainer_opened", { projectId: project?.id });
      onOpen && onOpen();
    }
    setOpen((v) => !v);
  };

  return (
    <Card className="p-4 rounded-2xl border border-white/10 bg-[rgba(8,12,24,.85)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm opacity-70">ETA to next milestone</div>
          <div className="mt-0.5 text-lg font-semibold">{etaText}</div>
          <div className="mt-1 text-xs opacity-70">
            {pct != null ? `Confidence ${pct}%` : "Confidence —"}
            {project?.name ? <> · {project.name}</> : null}
          </div>
        </div>
        <button
          onClick={toggle}
          className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-white/10 hover:bg-white/10"
          title="Why this ETA?"
          aria-expanded={open ? "true" : "false"}
        >
          <Info size={14} />
          Why
          <ChevronDown
            size={14}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Collapse */}
      {open && (
        <div className="mt-3">
          {reasons?.length ? (
            <ul className="text-xs space-y-1.5">
              {reasons.map((r, i) => (
                <li key={i} className="opacity-80 leading-5">
                  • {r}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs opacity-60">
              No explanation available yet.
            </div>
          )}

          {samples?.length ? (
            <div className="mt-3 rounded-lg border border-white/10 p-2">
              <div className="text-[11px] opacity-70 mb-1">
                Similar tasks (median)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {samples.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-white/10 px-2 py-1 text-[11px] flex items-center justify-between"
                    title={s.label}
                  >
                    <span className="truncate opacity-75">{s.label}</span>
                    <strong className="tabular-nums ml-2">
                      {s.medianDays}d
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
