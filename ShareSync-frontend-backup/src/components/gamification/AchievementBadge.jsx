// src/components/gamification/AchievementBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Premium Achievement Artifacts (Delight)
// - Richer gold gradients, tactile borders, and deep glows.
// - High-contrast typography for the badge titles.
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
              ? 'bg-gradient-to-br from-[#FDE68A] via-[#F59E0B] to-[#D97706] shadow-[0_4px_20px_rgba(217,119,6,0.25)] border-2 border-[#FEF3C7] group-hover:-translate-y-1 group-hover:shadow-[0_8px_25px_rgba(217,119,6,0.4)]' 
              : 'bg-slate-50 dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 opacity-60 grayscale group-hover:grayscale-[0.5] group-hover:opacity-100 transition-all shadow-inner'
            }
          `}
        >
          {/* Inner Glow/Depth Ring */}
          <div className={`absolute inset-1 rounded-xl border ${isEarned ? 'border-white/40 shadow-inner' : 'border-slate-200/50 dark:border-white/5'}`} />
          
          <IconComponent 
            className={`
              ${sz.icon} relative z-10 transition-transform duration-300 group-hover:scale-110
              ${isEarned ? 'text-[#78350F] drop-shadow-sm' : 'text-slate-400 dark:text-zinc-600'}
            `} 
            strokeWidth={isEarned ? 2.5 : 2}
          />

          {/* Earned Checkmark */}
          {isEarned && size !== 'sm' && (
            <div className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-[#1f1f23] rounded-full p-0.5 shadow-md border border-slate-100 dark:border-zinc-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-center w-full max-w-[120px]">
          <h4 className={`text-[13px] font-black tracking-tight leading-tight mb-1 transition-colors ${isEarned ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-500'}`}>
            {name}
          </h4>
          <div className="flex flex-col items-center gap-1">
            {isEarned ? (
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                +{xpReward} XP
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                Locked
              </span>
            )}
            {isEarned && earnedDate && (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                {new Date(earnedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
