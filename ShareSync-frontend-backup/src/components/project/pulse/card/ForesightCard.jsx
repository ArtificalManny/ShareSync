import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Gauge,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function clampNumber(value, min = 0, max = 100, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function readText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function getTone(severity) {
  const level = String(severity || "low").toLowerCase();

  if (level === "high") {
    return {
      ring: "border-rose-200 dark:border-rose-500/20",
      iconWrap:
        "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
      badge:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
      glow: "rgba(244,63,94,0.12)",
      line: "from-rose-500 via-orange-400 to-amber-300",
    };
  }

  if (level === "medium") {
    return {
      ring: "border-amber-200 dark:border-amber-500/20",
      iconWrap:
        "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      badge:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
      glow: "rgba(245,158,11,0.13)",
      line: "from-amber-400 via-orange-400 to-violet-400",
    };
  }

  return {
    ring: "border-emerald-200 dark:border-emerald-500/20",
    iconWrap:
      "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    glow: "rgba(16,185,129,0.12)",
    line: "from-emerald-400 via-cyan-400 to-violet-400",
  };
}

export default function ForesightCard({ metrics = {}, foresight: directForesight = null }) {
  const data = directForesight || metrics?.foresight || {};
  const signals = data?.signals || {};

  const severity = data?.severity || "low";
  const tone = getTone(severity);

  const confidence = clampNumber(
    data?.confidence ?? data?.confidenceScore ?? metrics?.confidence,
    0,
    100,
    72
  );

  const prediction = readText(
    data?.prediction,
    "Execution signals are still forming. Add movement to generate a sharper forecast."
  );

  const suggestedNext = readText(
    data?.suggestedNext || data?.nextMove || data?.suggestedMove,
    "Choose the next high-leverage move"
  );

  const recommendation = readText(
    data?.recommendation,
    "Keep the scope narrow and finish the next visible move."
  );

  const riskLabel = readText(data?.riskLabel || data?.statusLabel, "Stable read");

  const risks = Array.isArray(data?.risks) ? data.risks.filter(Boolean) : [];

  const blocked = clampNumber(signals?.blocked, 0, 999, 0);
  const ready = clampNumber(signals?.ready, 0, 999, 0);
  const trend = Number.isFinite(Number(signals?.trend)) ? Number(signals.trend) : 0;

  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border ${tone.ring} bg-white p-5 shadow-sm dark:bg-[#111113] dark:shadow-none`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.line}`} />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
        style={{ background: tone.glow }}
      />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${tone.iconWrap}`}
          >
            <Radar className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-950 dark:text-white">
                Foresight
              </h3>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone.badge}`}>
                <Gauge className="h-3.5 w-3.5" />
                {confidence}% confidence
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Predictive execution readout
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
          <BrainCircuit className="h-3.5 w-3.5" />
          AI
        </span>
      </header>

      <div className="relative z-10 space-y-4">
        <div className={`rounded-2xl border p-4 ${tone.ring} bg-white/70 dark:bg-white/[0.03]`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Prediction
            </p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone.badge}`}>
              {riskLabel}
            </span>
          </div>

          <p className="text-sm leading-6 text-slate-800 dark:text-zinc-200">
            {prediction}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Blocked
            </p>
            <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">
              {blocked}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Ready
            </p>
            <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">
              {ready}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Trend
            </p>
            <p className={`mt-1 text-lg font-black ${trend < 0 ? "text-rose-500" : trend > 0 ? "text-emerald-600" : "text-slate-950 dark:text-white"}`}>
              {trend > 0 ? `+${trend}` : trend}
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <Route className="h-3.5 w-3.5" />
              Suggested next
            </p>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
              <ArrowRight className="h-4 w-4 text-amber-500" />
              {suggestedNext}
            </p>
          </div>

          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <Sparkles className="h-3.5 w-3.5" />
              Recommendation
            </p>
            <p className="text-sm leading-6 text-slate-700 dark:text-zinc-300">
              {recommendation}
            </p>
          </div>
        </div>

        {risks.length > 0 ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              Risks
            </p>
            <div className="space-y-1.5">
              {risks.slice(0, 3).map((risk, index) => (
                <p key={`${risk}-${index}`} className="text-xs leading-5 text-slate-600 dark:text-zinc-300">
                  {risk}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              No major execution risk detected from current signals.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
