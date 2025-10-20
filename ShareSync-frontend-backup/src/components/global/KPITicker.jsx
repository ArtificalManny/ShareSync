import React from "react";
import { Info } from "lucide-react";
import { track } from "../../utils/telemetry";

/**
 * KPITicker
 * Tiny CNBC-style readout for momentum KPIs.
 *
 * Props:
 * - velocity: number (e.g., 1.2)
 * - ontime: number (0-100)
 * - streak: number (days)
 * - onOpenPanel?: () => void (optional)
 * - deltas?: { velocity?: number, ontime?: number, streak?: number }
 */
export default function KPITicker({
  velocity = 1.0,
  ontime = 0,
  streak = 0,
  deltas = {},
  onOpenPanel,
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Pill
        label="Velocity"
        value={`${velocity.toFixed(1)}x`}
        delta={deltas.velocity}
      />
      <Pill
        label="On-time"
        value={`${Math.round(ontime)}%`}
        delta={deltas.ontime}
      />
      <Pill label="Streak" value={`${streak}d`} delta={deltas.streak} />
      <button
        type="button"
        className="ml-1 rounded-full p-1 border border-white/10 hover:bg-white/10"
        title="Open KPI details"
        aria-label="Open KPI details"
        onClick={() => {
          track("kpi_ticker_opened");
          onOpenPanel && onOpenPanel();
        }}
      >
        <Info size={14} />
      </button>
    </div>
  );
}

function Pill({ label, value, delta }) {
  const positive = typeof delta === "number" && delta >= 0;
  const showDelta = typeof delta === "number";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 border text-[11px]"
      style={{
        borderColor: "rgba(255,255,255,.12)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
      }}
      onMouseEnter={() => track("kpi_delta_hovered", { label })}
    >
      <span className="opacity-70">{label}</span>
      <strong className="tabular-nums">{value}</strong>
      {showDelta ? (
        <em
          className="not-italic tabular-nums"
          style={{
            color: positive
              ? "var(--accent-aqua, #22d3ee)"
              : "var(--warn-amber, #f59e0b)",
          }}
        >
          {positive ? "▲" : "▼"} {Math.abs(delta)}
        </em>
      ) : null}
    </span>
  );
}

/**
 * Optional inline panel (use in Navbar popover if you want).
 */
export function KPIPanel({ items = [] }) {
  // items: [{ label, value, detail }]
  if (!items?.length) return null;
  return (
    <div className="p-3 rounded-xl border border-white/10 bg-[rgba(8,12,24,.92)] shadow-xl min-w-[240px]">
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-3 text-xs"
          >
            <div className="opacity-75">{it.label}</div>
            <div className="text-right">
              <div className="font-semibold">{it.value}</div>
              {it.detail ? (
                <div className="opacity-60">{it.detail}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
