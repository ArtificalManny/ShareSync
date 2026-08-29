// src/components/growth/SkillRadarChart.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Skill Radar Chart  (data-driven)
//
// FIX: previously this expected an ARRAY of { name, score } and hardcoded a fixed
// set of 6 axis names (execution/leadership/technical/...). The growth hook hands
// it an OBJECT of the 4 signals the backend actually computes
// ({ velocity, quality, collaboration, reliability }). The shape mismatch made
// .forEach a no-op, and the name mismatch meant the axes had no source key — so
// every axis read 0 (the all-zeros radar).
//
// Now it derives its axes from whatever it's given:
//   - accepts an OBJECT { key: number } or { key: { score } }  (current payload)
//   - still accepts the legacy ARRAY [{ name, score, trend, change }]  (back-compat)
//   - spaces axes evenly starting at the top; reproduces the original 6-axis
//     angles exactly when given 6 keys.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Pretty labels for known signal keys; anything else is title-cased automatically.
const SKILL_LABELS = {
  velocity: 'Velocity',
  quality: 'Quality',
  collaboration: 'Collaboration',
  reliability: 'Reliability',
  // legacy / future axes still render correctly if the backend ever sends them
  execution: 'Execution',
  leadership: 'Leadership',
  technical: 'Technical',
  communication: 'Communication',
  strategy: 'Strategy',
};

function titleCase(key = '') {
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Normalize either an object or an array into a consistent axis list.
function toAxisList(skills) {
  if (!skills) return [];

  let entries = [];
  if (Array.isArray(skills)) {
    entries = skills.map((s) => [s?.name ?? s?.key, s]);
  } else if (typeof skills === 'object') {
    entries = Object.entries(skills);
  }

  return entries
    .filter(([key]) => key != null)
    .map(([key, raw]) => {
      const rawScore =
        typeof raw === 'number' ? raw : Number(raw?.score ?? raw?.value ?? 0);
      const score = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, rawScore))
        : 0;

      return {
        key,
        label: SKILL_LABELS[key] || titleCase(key),
        score,
        normalized: score / 100,
        trend: typeof raw === 'object' && raw ? raw.trend : undefined,
        change: typeof raw === 'object' && raw ? Number(raw.change || 0) : 0,
      };
    });
}

export default function SkillRadarChart({
  skills = [],
  size = 300,
  showLabels = true,
  showValues = true,
  showTrends = true,
  animated = true,
  className = '',
}) {
  const center = size / 2;
  const radius = (size - 80) / 2;

  const axes = useMemo(() => toAxisList(skills), [skills]);

  // Even angular spacing, starting at the top (-90°) and going clockwise.
  // For 6 axes this yields -90,-30,30,90,150,210 — identical to the old layout.
  const points = useMemo(() => {
    const n = axes.length || 1;
    return axes.map((axis, i) => {
      const angle = -90 + (360 / n) * i;
      const angleRad = (angle * Math.PI) / 180;
      const r = radius * axis.normalized;
      return {
        ...axis,
        angle,
        x: center + r * Math.cos(angleRad),
        y: center + r * Math.sin(angleRad),
      };
    });
  }, [axes, center, radius]);

  const polygonPath =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
      : '';

  const rings = [0.25, 0.5, 0.75, 1];

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-error-500" />;
    return <Minus className="w-3 h-3 text-text-tertiary" />;
  };

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <circle cx={center} cy={center} r={radius + 10} fill="rgba(255,255,255,0.02)" />

        {/* Grid Rings */}
        {rings.map((ring, i) => (
          <g key={i}>
            <circle
              cx={center}
              cy={center}
              r={radius * ring}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={center + 5}
              y={center - radius * ring + 4}
              className="fill-text-tertiary text-[8px]"
            >
              {Math.round(ring * 100)}
            </text>
          </g>
        ))}

        {/* Axis Lines */}
        {points.map((point) => {
          const angleRad = (point.angle * Math.PI) / 180;
          return (
            <line
              key={`axis-${point.key}`}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angleRad)}
              y2={center + radius * Math.sin(angleRad)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Data Polygon */}
        {polygonPath && (
          <path
            d={polygonPath}
            fill="url(#skillGradient)"
            stroke="#7C3AED"
            strokeWidth="2"
            className={animated ? 'transition-all duration-500' : ''}
          />
        )}

        {/* Data Points */}
        {points.map((point) => (
          <g key={point.key}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#7C3AED"
              stroke="#0F172A"
              strokeWidth="2"
              className={animated ? 'transition-all duration-500' : ''}
            />
            {point.normalized > 0.8 && (
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="none"
                stroke="#7C3AED"
                strokeWidth="1"
                opacity="0.3"
              />
            )}
          </g>
        ))}

        {/* Labels */}
        {showLabels &&
          points.map((point) => {
            const angleRad = (point.angle * Math.PI) / 180;
            const labelRadius = radius + 35;
            const x = center + labelRadius * Math.cos(angleRad);
            const y = center + labelRadius * Math.sin(angleRad);

            // Anchor based on horizontal position (works for any axis count).
            const cos = Math.cos(angleRad);
            let textAnchor = 'middle';
            if (cos > 0.25) textAnchor = 'start';
            else if (cos < -0.25) textAnchor = 'end';

            return (
              <g key={`label-${point.key}`}>
                <text
                  x={x}
                  y={y - 6}
                  textAnchor={textAnchor}
                  className="fill-text-secondary text-[11px] font-medium"
                >
                  {point.label}
                </text>
                {showValues && (
                  <text
                    x={x}
                    y={y + 8}
                    textAnchor={textAnchor}
                    className="fill-brand text-[13px] font-bold"
                  >
                    {point.score}
                  </text>
                )}
              </g>
            );
          })}
      </svg>

      {/* Trend Legend (only when per-axis change data is present) */}
      {showTrends && points.some((p) => p.change !== 0) && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4">
          {points
            .filter((p) => p.change !== 0)
            .slice(0, 3)
            .map((point) => (
              <div key={point.key} className="flex items-center gap-1 text-xs">
                <TrendIcon trend={point.trend} />
                <span className="text-text-tertiary">{point.label}</span>
                <span className={point.change > 0 ? 'text-success' : 'text-error-500'}>
                  {point.change > 0 ? '+' : ''}
                  {point.change}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * Mini version for compact displays
 */
export function MiniSkillRadar({ skills, size = 100 }) {
  return (
    <SkillRadarChart
      skills={skills}
      size={size}
      showLabels={false}
      showValues={false}
      showTrends={false}
      animated={false}
    />
  );
}
