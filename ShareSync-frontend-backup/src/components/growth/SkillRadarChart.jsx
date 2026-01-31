// src/components/growth/SkillRadarChart.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Full Skill Radar Chart
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SKILL_CONFIG = {
  execution: { label: 'Execution', angle: -90 },
  leadership: { label: 'Leadership', angle: -30 },
  technical: { label: 'Technical', angle: 30 },
  collaboration: { label: 'Collaboration', angle: 90 },
  communication: { label: 'Communication', angle: 150 },
  strategy: { label: 'Strategy', angle: 210 },
};

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

  // Convert skills array to normalized values
  const normalizedSkills = useMemo(() => {
    const skillMap = {};
    skills.forEach(skill => {
      skillMap[skill.name] = {
        ...skill,
        normalized: skill.score / 100,
      };
    });
    return skillMap;
  }, [skills]);

  // Calculate points for the radar polygon
  const points = useMemo(() => {
    return Object.entries(SKILL_CONFIG).map(([key, config]) => {
      const skill = normalizedSkills[key] || { normalized: 0, score: 0 };
      const angleRad = (config.angle * Math.PI) / 180;
      const r = radius * skill.normalized;
      return {
        key,
        x: center + r * Math.cos(angleRad),
        y: center + r * Math.sin(angleRad),
        label: config.label,
        score: skill.score || 0,
        trend: skill.trend,
        change: skill.change || 0,
        angle: config.angle,
        normalized: skill.normalized,
      };
    });
  }, [normalizedSkills, center, radius]);

  // Create polygon path
  const polygonPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  // Grid rings
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
            {/* Ring label */}
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
        {Object.entries(SKILL_CONFIG).map(([key, config]) => {
          const angleRad = (config.angle * Math.PI) / 180;
          const x2 = center + radius * Math.cos(angleRad);
          const y2 = center + radius * Math.sin(angleRad);
          return (
            <line
              key={key}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <path
          d={polygonPath}
          fill="url(#skillGradient)"
          stroke="#7C3AED"
          strokeWidth="2"
          className={animated ? 'transition-all duration-500' : ''}
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>
        </defs>

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
            {/* Glow effect for high scores */}
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
        {showLabels && points.map((point) => {
          const angleRad = (point.angle * Math.PI) / 180;
          const labelRadius = radius + 35;
          const x = center + labelRadius * Math.cos(angleRad);
          const y = center + labelRadius * Math.sin(angleRad);

          // Adjust text anchor based on position
          let textAnchor = 'middle';
          if (point.angle > 45 && point.angle < 135) textAnchor = 'start';
          if (point.angle > 225 && point.angle < 315) textAnchor = 'end';
          if (point.angle < -45 || point.angle > 135) textAnchor = 'start';

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

      {/* Trend Legend */}
      {showTrends && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4">
          {points.filter(p => p.change !== 0).slice(0, 3).map(point => (
            <div key={point.key} className="flex items-center gap-1 text-xs">
              <TrendIcon trend={point.trend} />
              <span className="text-text-tertiary">{point.label}</span>
              <span className={point.change > 0 ? 'text-success' : 'text-error-500'}>
                {point.change > 0 ? '+' : ''}{point.change}
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
