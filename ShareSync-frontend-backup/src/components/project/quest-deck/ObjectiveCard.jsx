// src/components/project/quest-deck/ObjectiveCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Objective Card with Impact Badge & Momentum Tag
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Target, Zap, Calendar, CheckCircle2 } from 'lucide-react';

const IMPACT_CONFIG = {
  high: {
    color: 'text-error-500',
    bg: 'bg-error-500/10',
    label: 'High Impact',
  },
  medium: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'Medium',
  },
  low: {
    color: 'text-text-tertiary',
    bg: 'bg-surface-2',
    label: 'Low',
  },
};

export default function ObjectiveCard({ objective, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    title,
    description,
    progress = 0,
    impact = 'medium',
    momentum = 0,
    owner,
    eta,
    tasksTotal = 0,
    tasksComplete = 0,
  } = objective;

  const impactConfig = IMPACT_CONFIG[impact] || IMPACT_CONFIG.medium;
  const progressPercent = Math.round(progress * 100);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-5 rounded-xl text-left w-full
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isHovered ? 'transform -translate-y-1' : ''}
      `}
    >
      {/* Impact Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`
          px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
          ${impactConfig.bg} ${impactConfig.color}
        `}>
          {impactConfig.label}
        </span>
        
        {/* Momentum Tag */}
        <span className="flex items-center gap-1 text-xs font-medium text-brand">
          <Zap className="w-3 h-3" />
          +{momentum}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-text-tertiary mb-4 line-clamp-2">
          {description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-tertiary">Progress</span>
          <span className="font-medium text-text-secondary">{progressPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div 
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        {/* Owner */}
        {owner && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface-2 overflow-hidden">
              {owner.avatar ? (
                <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-text-tertiary">
                  {owner.name?.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs text-text-tertiary">{owner.name}</span>
          </div>
        )}

        {/* ETA / Tasks */}
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          {eta && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {eta}
            </span>
          )}
          
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {tasksComplete}/{tasksTotal}
          </span>
        </div>
      </div>

      {/* Hover sparkline - TODO: Add activity sparkline */}
      {isHovered && (
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
      )}
    </button>
  );
}
