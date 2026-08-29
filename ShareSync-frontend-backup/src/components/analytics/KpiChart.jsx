import React, { useMemo, useId, useCallback } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { fmtAxisNumber, fmtDateLabel } from "../../utils/formatters";
import "../../styles/kpi.css";

/** Tooltip content (charts.css skin-compatible) */
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

/** Focusable/clickable dot for points (keyboard + a11y) */
function FocusDot({ cx, cy, payload, index, stroke, seriesLabel, onPointClick }) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  const tRaw = payload?.label ?? payload?.t ?? payload?.date ?? "";
  const v = Number(payload?.v ?? payload?.value ?? 0);
  const handleActivate = (e) => {
    e.stopPropagation();
    onPointClick?.({
      label: seriesLabel || "Series",
      t: tRaw,
      v,
      idx: index,
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate(e);
    }
  };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${seriesLabel || "Series"}: ${fmtDateLabel(tRaw)} ${v}`}
      className="kpi-dot"
      onKeyDown={onKeyDown}
      onClick={handleActivate}
    >
      <circle cx={cx} cy={cy} r={5} fill="currentColor" stroke={stroke || "none"} />
    </g>
  );
}

/**
 * KpiChart (Interactive)
 *
 * Props:
 *  - title: string
 *  - series: Array<{ t: ISOString|Date|number, v: number }>
 *  - color?: CSS color
 *  - gradientVariant?: 'blue' | 'purple' | 'emerald'
 *  - height?: number (default 160)
 *  - showLegend?: boolean
 *  - onPointClick?: ({ label, t, v, idx }) => void
 *  - motionEnabled?: boolean (overrides prefers-reduced-motion)
 */
export default function KpiChart({
  title,
  series = [],
  color,
  gradientVariant = "blue",
  height = 160,
  showLegend = false,
  onPointClick,
  motionEnabled,
}) {
  const id = useId().replace(/:/g, "");
  const strokeColor = color || "rgb(var(--accent))";

  // Motion guard
  const prefersReduced =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anim = typeof motionEnabled === "boolean" ? motionEnabled : !prefersReduced;

  // Gradient selection
  const stops = useMemo(() => {
    if (color) return { from: strokeColor, to: strokeColor };
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

  // Normalize series
  const data = useMemo(
    () =>
      (series || []).map((d, i) => {
        const t =
          typeof d.t === "string" || typeof d.t === "number" ? new Date(d.t) : d.t;
        const iso = t instanceof Date ? t.toISOString() : String(t);
        return { t, v: Number(d.v) || 0, label: iso, _i: i };
      }),
    [series]
  );

  // Memo dot renderer so it’s stable
  const renderDot = useCallback(
    (props) => (
      <FocusDot
        {...props}
        seriesLabel={title}
        onPointClick={onPointClick}
        stroke={color ? strokeColor : undefined}
      />
    ),
    [title, onPointClick, color, strokeColor]
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-3 chart-fade-in kpi-card" role="img" aria-label={`Chart: ${title}`}>
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

            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: "rgb(var(--muted))" }}
              />
            )}

            <Area
              type="monotone"
              dataKey="v"
              stroke={color ? strokeColor : `url(#line-grad-${id})`}
              strokeWidth={2}
              fill={`url(#area-grad-${id})`}
              isAnimationActive={anim}
              animationDuration={700}
              dot={renderDot}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={color ? strokeColor : `url(#line-grad-${id})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={anim}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
