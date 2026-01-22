// src/components/retro/CategoryBreakdown.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Category Breakdown
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { PieChart, Tag } from 'lucide-react';

const CATEGORY_COLORS = {
  development: '#A855F7', // brand
  dev: '#A855F7',
  code: '#A855F7',
  design: '#EC4899', // pink
  ui: '#EC4899',
  ux: '#EC4899',
  marketing: '#F59E0B', // warning
  writing: '#14B8A6', // teal
  content: '#14B8A6',
  meeting: '#6366F1', // indigo
  meetings: '#6366F1',
  planning: '#3B82F6', // blue
  research: '#8B5CF6', // violet
  bug: '#EF4444', // red
  bugfix: '#EF4444',
  feature: '#10B981', // success
  security: '#F97316', // orange
  testing: '#06B6D4', // cyan
  ops: '#64748B', // slate
  devops: '#64748B',
  general: '#94A3B8', // text-tertiary
};

/**
 * CategoryBreakdown - Pie/donut chart of task categories
 */
export default function CategoryBreakdown({ categories = {} }) {
  const data = useMemo(() => {
    const entries = Object.entries(categories);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    
    return entries
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_COLORS[name.toLowerCase()] || CATEGORY_COLORS.general,
      }))
      .sort((a, b) => b.count - a.count);
  }, [categories]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06] text-center">
        <PieChart className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-sm text-text-tertiary">No category data yet</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-brand" />
        Category Breakdown
      </h3>

      <div className="flex gap-6">
        {/* Donut chart */}
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {renderDonutSegments(data)}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text-primary">{total}</span>
            <span className="text-[10px] text-text-tertiary">tasks</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.slice(0, 5).map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-text-secondary capitalize flex-1 truncate">
                {item.name}
              </span>
              <span className="text-sm font-medium text-text-primary">
                {item.count}
              </span>
              <span className="text-xs text-text-tertiary w-10 text-right">
                {item.percentage}%
              </span>
            </div>
          ))}
          {data.length > 5 && (
            <div className="text-xs text-text-tertiary">
              +{data.length - 5} more categories
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render donut chart segments
 */
function renderDonutSegments(data) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  let currentAngle = 0;
  const segments = [];
  const radius = 40;
  const strokeWidth = 12;

  data.forEach((item, i) => {
    const percentage = item.count / total;
    const angle = percentage * 360;
    
    // Calculate arc
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const x1 = 50 + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 50 + radius * Math.sin((endAngle * Math.PI) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    if (percentage > 0) {
      segments.push(
        <circle
          key={i}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={item.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${percentage * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
          strokeDashoffset={-currentAngle * (Math.PI / 180) * radius}
          className="transition-all duration-500"
        />
      );
    }
    
    currentAngle += angle;
  });

  return segments;
}

/**
 * CategoryBar - Horizontal bar version
 */
export function CategoryBar({ categories = {} }) {
  const data = Object.entries(categories)
    .map(([name, count]) => ({
      name,
      count,
      color: CATEGORY_COLORS[name.toLowerCase()] || CATEGORY_COLORS.general,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-text-secondary capitalize">{item.name}</span>
            <span className="text-sm font-medium text-text-primary">{item.count}</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
