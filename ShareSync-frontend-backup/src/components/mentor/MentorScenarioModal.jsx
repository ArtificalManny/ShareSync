import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { X, Calculator, Activity, Scissors, Users, ChevronRight } from "lucide-react";
import { probabilities } from "../../api/mentor";
import { toast } from "../ui/Toaster.jsx";
import { track } from "../../utils/telemetry";

/**
 * MentorScenarioModal
 * What-if modal to run Monte-Carlo on changes:
 *  - Reassign: add/remove active contributors
 *  - Slip: schedule slip in days (start later)
 *  - Scope cut: reduce remaining scope (%)
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - projectId: string (required)
 *  - baseline?: { avgDailyVelocity?: number, remainingScope?: number } (optional UI hints)
 */
export default function MentorScenarioModal({ open, onClose, projectId, baseline = {} }) {
  const dialogId = useId().replace(/:/g, "");
  const ref = useRef(null);

  const [horizonDays, setHorizonDays] = useState(30);
  const [trials, setTrials] = useState(1000);
  const [deltaContributors, setDeltaContributors] = useState(1); // +1 by default
  const [slipDays, setSlipDays] = useState(0);
  const [scopeCutPct, setScopeCutPct] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);

  // Focus trap-ish: focus the modal when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        try { ref.current?.focus(); } catch {}
      }, 0);
      try {
        track("mentor_scenario_opened", { projectId });
      } catch {}
    } else {
      setRes(null);
      setErr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    onClose?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      close();
    }
  };

  const run = async () => {
    if (!projectId) return;
    setLoading(true);
    setErr("");
    try {
      const payload = {
        horizonDays: Math.max(7, Number(horizonDays) || 30),
        trials: Math.max(200, Number(trials) || 1000),
        scenario: {
          deltaContributors: Number(deltaContributors) || 0, // + adds, - removes
          slipDays: Math.max(0, Number(slipDays) || 0),
          scopeCutPct: Math.min(100, Math.max(0, Number(scopeCutPct) || 0)),
        },
      };
      const data = await probabilities(projectId, payload);
      setRes(data);
      try {
        track("mentor_scenario_run", {
          projectId,
          ...payload.scenario,
          horizonDays: payload.horizonDays,
          trials: payload.trials,
          onTimeProb: data?.onTimeProb ?? null,
        });
      } catch {}
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to run probabilities");
    } finally {
      setLoading(false);
    }
  };

  const pctFmt = (v) =>
    typeof v === "number" && isFinite(v) ? `${Math.round(v * 100)}%` : "—";

  const rows = useMemo(() => {
    if (!res) return [];
    const p = res.percentiles || {};
    return [
      ["P50 ETA", p.p50 || res.etaP50 || "—"],
      ["P80 ETA", res.etaP80 || p.p80 || p.p90 || "—"],
      ["On-time probability", pctFmt(res.onTimeProb)],
      ["Trials", String(res.trials || 1000)],
      ["Horizon", `${res.horizonDays || 30} days`],
    ];
  }, [res]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center"
      aria-labelledby={`scenario-title-${dialogId}`}
      aria-modal="true"
      role="dialog"
      onKeyDown={onKeyDown}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      {/* modal */}
      <section
        ref={ref}
        tabIndex={-1}
        className="relative w-[min(720px,92vw)] rounded-2xl border border-border bg-surface p-4 shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            <h2 id={`scenario-title-${dialogId}`} className="text-base font-semibold text-text">
              Mentor: What-if scenario
            </h2>
          </div>
          <button
            aria-label="Close"
            className="p-1 rounded-md hover:bg-surface/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={close}
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </header>

        {/* Inputs */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Horizon (days)"
            description="How far to simulate."
          >
            <NumberInput value={horizonDays} onChange={setHorizonDays} min={7} />
          </Field>

          <Field
            label="Trials"
            description="More = smoother, slower."
          >
            <NumberInput value={trials} onChange={setTrials} min={200} step={100} />
          </Field>

          <Field
            label="Reassign contributors"
            description="Add/remove active contributors."
            icon={<Users className="w-3.5 h-3.5" />}
          >
            <NumberInput value={deltaContributors} onChange={setDeltaContributors} step={1} />
          </Field>

          <Field
            label="Schedule slip (days)"
            description="Start later by this many days."
            icon={<Activity className="w-3.5 h-3.5" />}
          >
            <NumberInput value={slipDays} onChange={setSlipDays} min={0} />
          </Field>

          <Field
            label="Scope cut (%)"
            description="Reduce remaining scope."
            icon={<Scissors className="w-3.5 h-3.5" />}
          >
            <NumberInput value={scopeCutPct} onChange={setScopeCutPct} min={0} max={100} />
          </Field>

          {/* Baseline hints */}
          <div className="rounded-xl border border-border bg-surface p-3 text-xs text-muted">
            <div>Baseline (optional hints)</div>
            <ul className="mt-1 list-disc list-inside">
              <li>Avg daily velocity: <strong>{baseline.avgDailyVelocity ?? "—"}</strong></li>
              <li>Remaining scope: <strong>{baseline.remainingScope ?? "—"}</strong></li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
            onClick={run}
            disabled={loading}
          >
            {loading ? "Running…" : "Run scenario"}
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface/70"
            onClick={close}
          >
            Close
          </button>
        </div>

        {/* Results */}
        <div className="mt-3">
          {err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
              {err}
            </div>
          ) : res ? (
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="text-sm font-semibold">Results</div>
              <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-text font-medium">{v}</dd>
                  </div>
                ))}
              </dl>

              {Array.isArray(res.notes) && res.notes.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs text-muted">
                  {res.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted">
              Configure a scenario and click <em>Run scenario</em> to see probabilities.
            </div>
          )}
        </div>

        {/* Reduced motion: nothing animated in this modal by default */}
      </section>
    </div>
  );
}

function Field({ label, description, icon, children }) {
  return (
    <label className="rounded-xl border border-border bg-surface p-3 block">
      <div className="text-xs text-muted inline-flex items-center gap-1">
        {icon ? icon : null}
        <span>{label}</span>
      </div>
      <div className="mt-1">{children}</div>
      {description ? <div className="mt-1 text-[11px] text-muted">{description}</div> : null}
    </label>
  );
}

function NumberInput({ value, onChange, step = 1, min, max }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const v = e.target.value === "" ? "" : Number(e.target.value);
        if (e.target.value === "") return onChange("");
        if (typeof min === "number" && v < min) return onChange(min);
        if (typeof max === "number" && v > max) return onChange(max);
        onChange(v);
      }}
      step={step}
      min={min}
      max={max}
      className="w-full rounded-md border border-border bg-transparent px-2 py-1 text-sm"
    />
  );
}
