// src/components/gamification/AchievementBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2.5: Premium Achievement Artifacts
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Trophy, Star, Zap, Rocket, Flame, Target, CheckCircle2 } from 'lucide-react';

const ICON_MAP = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  rocket: Rocket,
  flame: Flame,
  target: Target,
};

export default function AchievementBadge({ 
  achievement, 
  size = 'md', // sm, md, lg
  showDetails = true,
  className = ''
}) {
  const { 
    name = "Mystery Badge", 
    description = "Keep shipping to unlock.", 
    icon = 'trophy', 
    isEarned = false, 
    earnedDate, 
    xpReward = 50 
  } = achievement || {};

  const IconComponent = ICON_MAP[icon] || Trophy;

  // Sizing tokens based on 8px grid
  const sizeClasses = {
    sm: { container: 'w-12 h-12', icon: 'w-5 h-5' },
    md: { container: 'w-16 h-16 md:w-20 md:h-20', icon: 'w-7 h-7 md:w-8 md:h-8' },
    lg: { container: 'w-24 h-24', icon: 'w-10 h-10' }
  };

  const sz = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center group ${className}`}>
      {/* The Artifact */}
      <div className="relative mb-3">
        <div 
          className={`
            ${sz.container} rounded-2xl flex items-center justify-center transition-all duration-300
            ${isEarned 
              ? 'bg-gradient-to-br from-[#FDE68A] to-[#F59E0B] shadow-[0_4px_20px_rgba(217,119,6,0.25)] border-2 border-[#FEF3C7] group-hover:-translate-y-1 group-hover:shadow-[0_8px_25px_rgba(217,119,6,0.35)]' 
              : 'bg-surface-secondary border border-border-default opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100'
            }
          `}
        >
          {/* Inner Glow/Depth Ring */}
          <div className={`absolute inset-1 rounded-xl border ${isEarned ? 'border-[#FCD34D]/50' : 'border-border-default/20'}`} />
          
          <IconComponent 
            className={`
              ${sz.icon} relative z-10 transition-transform duration-300 group-hover:scale-110
              ${isEarned ? 'text-[#78350F] drop-shadow-sm' : 'text-text-tertiary'}
            `} 
            strokeWidth={isEarned ? 2.5 : 2}
          />

          {/* Earned Checkmark */}
          {isEarned && size !== 'sm' && (
            <div className="absolute -bottom-1 -right-1 bg-surface-primary rounded-full p-0.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-success fill-success-subtle" />
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-center w-full max-w-[120px]">
          <h4 className={`text-[12px] font-black tracking-tight leading-tight mb-1 ${isEarned ? 'text-text-primary' : 'text-text-secondary'}`}>
            {name}
          </h4>
          <div className="flex flex-col items-center gap-0.5">
            {isEarned ? (
              <span className="text-[10px] font-bold text-warning uppercase tracking-widest bg-warning-subtle px-1.5 py-0.5 rounded-md">
                +{xpReward} XP
              </span>
            ) : (
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                Locked
              </span>
            )}
            {isEarned && earnedDate && (
              <span className="text-[9px] font-bold text-text-tertiary mt-1">
                {new Date(earnedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
