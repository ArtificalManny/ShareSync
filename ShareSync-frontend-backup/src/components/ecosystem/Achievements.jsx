// src/components/ecosystem/Achievements.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Delight - Achievements & Milestones
// - Implemented Shimmer effect for progress bars >= 80% (Dopamine trigger).
// - Upgraded to Gallery Walk layout constraints.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Trophy, Star, Zap, Shield, Flame, Target, Crown, Sparkles } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const colorStyles = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/10', icon: 'text-orange-500', progress: 'bg-gradient-to-r from-orange-400 to-orange-500' },
  yellow: { bg: 'bg-amber-50 dark:bg-amber-500/10', icon: 'text-amber-500', progress: 'bg-gradient-to-r from-amber-400 to-amber-500' },
  purple: { bg: 'bg-violet-50 dark:bg-violet-500/10', icon: 'text-violet-600 dark:text-violet-400', progress: 'bg-gradient-to-r from-violet-500 to-fuchsia-500' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-500/10', icon: 'text-blue-500', progress: 'bg-gradient-to-r from-blue-400 to-blue-500' },
  green:  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: 'text-emerald-500', progress: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
  red:    { bg: 'bg-red-50 dark:bg-red-500/10', icon: 'text-red-500', progress: 'bg-gradient-to-r from-red-400 to-red-500' },
};

const rarityStyles = {
  legendary: 'border-orange-400 dark:border-orange-500/50 shadow-[0_0_15px_rgba(251,146,60,0.2)]',
  epic: 'border-violet-500 dark:border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]',
  rare: 'border-blue-400 dark:border-blue-500/50',
  common: 'border-slate-200 dark:border-white/10',
};

const Achievements = () => {
  const isMobile = useIsMobile();

  const [achievements] = useState({
    recent: [
      { id: 1, name: '7-Day Streak', description: 'Ship something 7 days in a row', icon: Flame, color: 'orange', xp: 100, date: 'Today! 🎉', rarity: 'common' },
      { id: 2, name: 'Quick Shipper', description: 'Complete 5 tasks in under 25 minutes', icon: Zap, color: 'yellow', xp: 50, date: 'Yesterday', rarity: 'common' }
    ],
    milestones: [
      { id: 1, name: 'Level 5', current: 1850, target: 2000, icon: Star, color: 'purple' },
      { id: 2, name: '30-Day Streak', current: 7, target: 30, icon: Flame, color: 'orange' },
      { id: 3, name: '100 Ships', current: 42, target: 100, icon: Trophy, color: 'yellow' }
    ],
    badges: [
      { icon: Flame, color: 'orange', label: '7d', unlocked: true },
      { icon: Zap, color: 'yellow', label: 'Fast', unlocked: true },
      { icon: Shield, color: 'blue', label: 'Pro', unlocked: true },
      { icon: Trophy, color: 'gray', label: '100d', unlocked: false },
      { icon: Crown, color: 'gray', label: 'Elite', unlocked: false },
      { icon: Star, color: 'gray', label: 'Master', unlocked: false },
    ]
  });

  const getStyles = (color) => colorStyles[color] || colorStyles.purple;
  const getRarityBorder = (rarity) => rarityStyles[rarity] || rarityStyles.common;

  if (isMobile) {
    return (
      <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight">Achievements</h3>
        </div>
        {achievements.recent.length > 0 && (() => {
          const achievement = achievements.recent[0];
          const IconComponent = achievement.icon;
          const styles = getStyles(achievement.color);
          return (
            <div className={`border-l-4 ${getRarityBorder(achievement.rarity)} rounded-xl mb-5 bg-slate-50 dark:bg-white/5 border-y border-r border-slate-200 dark:border-transparent`}>
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${styles.bg} rounded-xl flex items-center justify-center border border-white/50 dark:border-white/10 shadow-sm`}>
                    <IconComponent className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-900 dark:text-white truncate">{achievement.name}</p>
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 mt-0.5">+{achievement.xp} XP</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <div className="flex gap-2 justify-center">
          {achievements.badges.slice(0, 6).map((badge, idx) => {
            const BadgeIcon = badge.icon;
            const styles = badge.unlocked ? getStyles(badge.color) : null;
            return (
              <div key={idx} className={`w-10 h-10 rounded-xl flex items-center justify-center ${badge.unlocked ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-50 shadow-sm' : 'bg-slate-50 dark:bg-white/5 opacity-50 border border-slate-200 dark:border-white/10'}`}>
                <BadgeIcon className={`w-4 h-4 ${badge.unlocked ? 'text-amber-600' : 'text-slate-400 dark:text-slate-600'}`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(139,92,246,0.04)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-500/10 rounded-xl flex items-center justify-center border border-amber-50 dark:border-amber-500/20 shadow-sm">
          <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-500" />
        </div>
        <div>
          <h3 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Your Achievements</h3>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Recent wins & milestones</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          Recently Earned
        </h4>
        {achievements.recent.map(achievement => {
          const IconComponent = achievement.icon;
          const styles = getStyles(achievement.color);
          return (
            <div key={achievement.id} className={`group border-l-[6px] ${getRarityBorder(achievement.rarity)} rounded-xl bg-slate-50 dark:bg-white/5 border-y border-r border-slate-200 dark:border-white/5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${styles.bg} rounded-xl flex items-center justify-center shrink-0 border border-white/50 dark:border-white/10 shadow-sm`}>
                    <IconComponent className={`w-6 h-6 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight">{achievement.name}</h5>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">{achievement.date}</span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-2.5">{achievement.description}</p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-500/20 rounded-lg text-[11px] font-black text-violet-700 dark:text-violet-300 uppercase tracking-widest shadow-sm">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      +{achievement.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 mb-8">
        <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest">
          <Target className="w-3.5 h-3.5 text-blue-500" />
          Next Milestones
        </h4>
        {achievements.milestones.map(milestone => {
          const IconComponent = milestone.icon;
          const styles = getStyles(milestone.color);
          const progress = (milestone.current / milestone.target) * 100;
          const isClose = progress >= 80; // Trigger shimmer
          
          return (
            <div key={milestone.id} className="bg-slate-50 dark:bg-white/5 rounded-xl p-5 border border-slate-200 dark:border-white/5 shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2.5 mb-4">
                <IconComponent className={`w-4 h-4 ${styles.icon}`} />
                <span className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight">{milestone.name}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{milestone.current} / {milestone.target}</span>
                  <span className={isClose ? 'text-violet-600 dark:text-violet-400 text-[13px] font-black' : 'text-slate-800 dark:text-white'}>{Math.round(progress)}%</span>
                </div>
                
                {/* 🚨 PHASE 3 SHIMMER EFFECT ADDED HERE 🚨 */}
                <div className="relative h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`absolute top-0 left-0 h-full ${styles.progress} rounded-full transition-all duration-700 ease-out`} 
                    style={{ width: `${progress}%` }} 
                  >
                    {isClose && (
                      <div className="absolute inset-0 w-full h-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ transform: 'skewX(-20deg)' }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">Badge Collection</h4>
        <div className="grid grid-cols-6 gap-3">
          {achievements.badges.map((badge, idx) => {
            const BadgeIcon = badge.icon;
            const styles = badge.unlocked ? getStyles(badge.color) : null;
            return (
              <div 
                key={idx} 
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300
                  ${badge.unlocked 
                    ? 'bg-gradient-to-br from-[#FDE68A] via-[#F59E0B] to-[#D97706] border-2 border-[#FEF3C7] shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer' 
                    : 'bg-slate-50 dark:bg-[#1f1f23] opacity-60 border border-slate-200 dark:border-white/10 grayscale'
                  }
                `} 
                title={badge.unlocked ? `${badge.label} Badge` : 'Locked'}
              >
                <div className={`absolute inset-1 rounded-xl border ${badge.unlocked ? 'border-white/30' : 'border-transparent'}`} />
                <BadgeIcon className={`relative z-10 w-6 h-6 ${badge.unlocked ? 'text-[#78350F]' : 'text-slate-400 dark:text-zinc-600'}`} strokeWidth={badge.unlocked ? 2.5 : 2} />
                {badge.unlocked && <span className="relative z-10 text-[9px] font-black text-[#78350F] uppercase tracking-wider">{badge.label}</span>}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Inline style for the shimmer animation if tailwind config lacks it */}
      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%) skewX(-20deg); }
          0% { transform: translateX(-100%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
};

export default Achievements;
