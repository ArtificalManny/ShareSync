// src/components/fairness/FairnessRadar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Radar Chart Visualization for Contribution Categories
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';

const CATEGORIES = [
  { key: 'tasks', label: 'Tasks', angle: -90 },
  { key: 'ships', label: 'Ships', angle: -18 },
  { key: 'codeReviews', label: 'Reviews', angle: 54 },
  { key: 'fireMode', label: 'Focus', angle: 126 },
  { key: 'unblocking', label: 'Unblock', angle: 198 },
];

export default function FairnessRadar({
  breakdown,
  maxValues, // Optional: max values for each category
  size = 200,
  showLabels = true,
  showValues = false,
  color = '#7C3AED',
  className = '',
}) {
  const center = size / 2;
  const radius = (size - 40) / 2;
  
  // Normalize values to 0-1 scale
  const normalizedValues = useMemo(() => {
    if (!breakdown) return {};
    
    const defaults = {
      tasks: 500,
      ships: 500,
      codeReviews: 300,
      fireMode: 200,
      unblocking: 200,
    };
    
    const maxVals = maxValues || defaults;
    
    return {
      tasks: Math.min(1, (breakdown.tasks || 0) / maxVals.tasks),
      ships: Math.min(1, (breakdown.ships || 0) / maxVals.ships),
      codeReviews: Math.min(1, (breakdown.codeReviews || 0) / maxVals.codeReviews),
      fireMode: Math.min(1, (breakdown.fireMode || 0) / maxVals.fireMode),
      unblocking: Math.min(1, (breakdown.unblocking || 0) / maxVals.unblocking),
    };
  }, [breakdown, maxValues]);

  // Calculate points for the radar polygon
  const points = useMemo(() => {
    return CATEGORIES.map(cat => {
      const value = normalizedValues[cat.key] || 0;
      const angleRad = (cat.angle * Math.PI) / 180;
      const r = radius * value;
      return {
        x: center + r * Math.cos(angleRad),
        y: center + r * Math.sin(angleRad),
        label: cat.label,
        value: breakdown?.[cat.key] || 0,
        normalizedValue: value,
        angle: cat.angle,
      };
    });
  }, [normalizedValues, breakdown, center, radius]);

  // Create polygon path
  const polygonPath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  // Grid rings (25%, 50%, 75%, Available)
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid Rings */}
        {rings.map((ring, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * ring}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines */}
        {CATEGORIES.map((cat, i) => {
          const angleRad = (cat.angle * Math.PI) / 180;
          const x2 = center + radius * Math.cos(angleRad);
          const y2 = center + radius * Math.sin(angleRad);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <path
          d={polygonPath}
          fill={`${color}20`}
          stroke={color}
          strokeWidth="2"
          className="transition-all duration-300"
        />

        {/* Data Points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            stroke="#0F172A"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        ))}

        {/* Labels */}
        {showLabels && CATEGORIES.map((cat, i) => {
          const angleRad = (cat.angle * Math.PI) / 180;
          const labelRadius = radius + 20;
          const x = center + labelRadius * Math.cos(angleRad);
          const y = center + labelRadius * Math.sin(angleRad);
          
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-text-tertiary text-[10px]"
            >
              {cat.label}
            </text>
          );
        })}
      </svg>

      {/* Value Legend */}
      {showValues && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-3 text-[10px]">
          {points.map((point, i) => (
            <span key={i} className="text-text-tertiary">
              {point.label}: <span className="text-text-secondary">{Math.round(point.value)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Mini version for cards
 */
export function MiniRadar({ breakdown, size = 60, color = '#7C3AED' }) {
  return (
    <FairnessRadar
      breakdown={breakdown}
      size={size}
      showLabels={false}
      showValues={false}
      color={color}
    />
  );
}
