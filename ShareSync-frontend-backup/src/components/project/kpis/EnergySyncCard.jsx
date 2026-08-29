// src/components/project/kpis/EnergySyncCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Energy Sync KPI Card
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows load vs capacity:
// - Energy battery visualization
// - Busy members count
// - Load level indicator
// - Suggested reassignments on hover
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Zap, Battery, BatteryLow, BatteryMedium, BatteryFull, AlertTriangle, ArrowRight } from 'lucide-react';

const LOAD_CONFIG = {
  low: {
    icon: BatteryLow,
    color: 'text-success',
    bg: 'bg-success/10',
    fill: 'bg-success',
    width: '33%',
    label: 'Low Load',
  },
  medium: {
    icon: BatteryMedium,
    color: 'text-brand',
    bg: 'bg-brand/10',
    fill: 'bg-brand',
    width: '66%',
    label: 'Medium Load',
  },
  high: {
    icon: BatteryFull,
    color: 'text-warning',
    bg: 'bg-warning/10',
    fill: 'bg-warning',
    width: '100%',
    label: 'High Load',
  },
};

const STATE_CONFIG = {
  ok: { color: 'text-success', label: 'Balanced' },
  at_risk: { color: 'text-warning', label: 'At Risk' },
  critical: { color: 'text-error-500', label: 'Overloaded' },
};

export default function EnergySyncCard({ data, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    load = 'medium',
    busyMembers = 0,
    totalMembers = 0,
    state = 'ok',
    overloaded = [],
    suggestions = [],
  } = data || {};

  const loadConfig = LOAD_CONFIG[load] || LOAD_CONFIG.medium;
  const stateConfig = STATE_CONFIG[state] || STATE_CONFIG.ok;
  const LoadIcon = loadConfig.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowSuggestions(false); }}
      className={`
        relative p-5 rounded-xl text-left
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isHovered ? 'transform -translate-y-0.5' : ''}
      `}
    >
      {/* State indicator line */}
      {state !== 'ok' && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${
          state === 'at_risk' ? 'bg-warning/50' : 'bg-error-500/50'
        }`} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${loadConfig.bg}`}>
            <Zap className={`w-4 h-4 ${loadConfig.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary">Energy Sync</h3>
            <p className="text-[10px] text-text-tertiary">Biometric Planning</p>
          </div>
        </div>
      </div>

      {/* Battery Visualization */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="
            flex-1 h-8 rounded-lg
            bg-surface-3 border border-white/[0.04]
            overflow-hidden
          ">
            <div 
              className={`h-full ${loadConfig.fill} transition-all duration-500`}
              style={{ width: loadConfig.width }}
            />
          </div>
          <LoadIcon className={`w-6 h-6 ${loadConfig.color}`} />
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${loadConfig.color}`}>
            {loadConfig.label}
          </span>
          <span className="text-xs text-text-tertiary">
            {busyMembers} of {totalMembers} busy
          </span>
        </div>
      </div>

      {/* Overloaded Warning */}
      {overloaded.length > 0 && (
        <div 
          className="mb-3 p-3 rounded-lg bg-warning/5 border border-warning/10"
          onMouseEnter={() => setShowSuggestions(true)}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span className="text-xs text-warning">
              {overloaded[0].name} at {overloaded[0].load}% capacity
            </span>
          </div>
        </div>
      )}

      {/* Suggestions Tooltip */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="
          absolute left-0 right-0 top-full mt-2 mx-4
          p-3 rounded-lg
          bg-surface-2 border border-white/[0.08]
          shadow-xl z-50
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <p className="text-xs text-text-tertiary mb-2">Suggested reassignments:</p>
          {suggestions.map((s, i) => (
            <div key={i} className="text-xs text-text-secondary">
              Move "{s.taskTitle}" from {s.from} → {s.to}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <span className={`text-xs ${stateConfig.color}`}>
          {stateConfig.label}
        </span>
        
        <span className="flex items-center gap-1 text-xs text-text-tertiary">
          Rebalance
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}
