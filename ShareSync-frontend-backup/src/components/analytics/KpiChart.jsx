import React, { useMemo, useId } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fmtAxisNumber, fmtDateLabel } from "../../utils/formatters";

/**
 * Tooltip content using charts.css skin
 */
function TooltipContent({ label, payload }) {
  if (!payload || payload.length === 0) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="ss-tooltip-inner">
      <div style={{ opacity: 0.85, marginBottom: 2 }}>{fmtDateLabel(label)}</div>
      <div style={{ fontWeight: 600 }}>{Number(val).toLocaleString()}</div>
    </div>
  );
}

/**
 * KpiChart
 * Reusable area/line chart with animated gradient and accessible tooltips.
 *
 * Props:
 *  - title: string
 *  - series: Array<{ t: ISOString|Date|number, v: number }>
 *  - color?: CSS color (overrides gradients)
 *  - gradientVariant?: 'blue' | 'purple' | 'emerald'  (default 'blue'; ignored if color provided)
 *  - height?: number (default 160)
 *  - showLegend?: boolean (reserved)
 *  - hoverGlow?: boolean (default true) → adds .kpi-glow on hover
 */
export default function KpiChart({
  title,
  series = [],
  color,
  gradientVariant = "blue",
  height = 160,
  showLegend = false,
  hoverGlow = true,
}) {
  const id = useId().replace(/:/g, "");
  const strokeColor = color || "rgb(var(--accent))";

  // Respect reduced motion (disable Recharts anims)
  const prefersReduced =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // pick gradient stops by variant (used when `color` not provided)
  const stops = useMemo(() => {
    if (color) {
      return { from: strokeColor, to: strokeColor };
    }
    switch (gradientVariant) {
      case "purple":
        return { from: "rgb(139 92 246)", to: "rgb(59 130 246)" }; // violet → blue
      case "emerald":
        return { from: "rgb(16 185 129)", to: "rgb(34 197 94)" };  // emerald → green
      case "blue":
      default:
        return { from: "rgb(14 165 233)", to: "rgb(79 70 229)" };  // sky → indigo
    }
  }, [gradientVariant, color, strokeColor]);

  const data = useMemo(
    () =>
      (series || []).map((d) => {
        const t = typeof d.t === "string" || typeof d.t === "number" ? new Date(d.t) : d.t;
        return {
          t,
          v: Number(d.v) || 0,
          label: t instanceof Date ? t.toISOString() : String(t),
        };
      }),
    [series]
  );

  return (
    <div
      className={[
        "rounded-xl border border-border bg-surface p-3 chart-fade-in",
        hoverGlow ? "transition-shadow hover:kpi-glow" : "",
      ].join(" ")}
    >
      <div className="text-xs text-muted mb-2">{title}</div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <defs>
              {/* Area fill gradient */}
              <linearGradient id={`area-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stops.to} stopOpacity={0.35} />
                <stop offset="95%" stopColor={stops.to} stopOpacity={0} />
              </linearGradient>

              {/* Line stroke gradient */}
              <linearGradient id={`line-grad-${id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={stops.from} />
                <stop offset="100%" stopColor={stops.to} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "rgb(var(--muted))" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              tickFormatter={(v) => fmtDateLabel(v)}
            />
            <YAxis
              dataKey="v"
              tick={{ fontSize: 11, fill: "rgb(var(--muted))" }}
              axisLine={false}
              tickLine={false}
              width={38}
              tickFormatter={fmtAxisNumber}
            />
            <Tooltip
              wrapperClassName="ss-tooltip"
              cursor={{ stroke: color ? strokeColor : stops.to, opacity: 0.15 }}
              content={<TooltipContent />}
              labelFormatter={(iso) => iso}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color ? strokeColor : `url(#line-grad-${id})`}
              strokeWidth={2}
              fill={`url(#area-grad-${id})`}
              isAnimationActive={!prefersReduced}
              animationDuration={700}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={color ? strokeColor : `url(#line-grad-${id})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={!prefersReduced}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}