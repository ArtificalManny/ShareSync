import React, { useState } from 'react';
import { Trophy, Star, Zap, Shield, Flame, Target, Crown, Sparkles } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const colorStyles = {
  orange: { bg: 'bg-orange-100 dark:bg-warning/10', icon: 'text-orange-500 dark:text-warning', progress: 'bg-orange-500 dark:bg-warning' },
  yellow: { bg: 'bg-amber-100 dark:bg-warning/10', icon: 'text-amber-500 dark:text-warning', progress: 'bg-amber-500 dark:bg-warning' },
  purple: { bg: 'bg-violet-100 dark:bg-brand/10', icon: 'text-violet-600 dark:text-brand', progress: 'bg-violet-600 dark:bg-brand' },
  blue: { bg: 'bg-blue-100 dark:bg-info/10', icon: 'text-blue-500 dark:text-info', progress: 'bg-blue-500 dark:bg-info' },
  green: { bg: 'bg-emerald-100 dark:bg-success/10', icon: 'text-emerald-500 dark:text-success', progress: 'bg-emerald-500 dark:bg-success' },
  red: { bg: 'bg-red-100 dark:bg-danger/10', icon: 'text-red-500 dark:text-danger', progress: 'bg-red-500 dark:bg-danger' },
};

const rarityStyles = {
  legendary: 'border-orange-400 dark:border-warning',
  epic: 'border-violet-500 dark:border-brand',
  rare: 'border-blue-400 dark:border-info',
  common: 'border-slate-200 dark:border-white/[0.1]',
};

// Accept the real stats from the Discover page
const Achievements = ({ currentLevel = 1, currentXp = 0, currentStreak = 0, totalShips = 0 }) => {
  const isMobile = useIsMobile();

  const achievements = {
    recent: [], // Purged fake achievements so it shows empty correctly for new accounts
    milestones: [
      { id: 1, name: `Level ${currentLevel + 1}`, current: currentXp, target: (currentLevel * 500) + 150, icon: Star, color: 'purple' },
      { id: 2, name: '30-Day Streak', current: currentStreak, target: 30, icon: Flame, color: 'orange' },
      { id: 3, name: '100 Ships', current: totalShips, target: 100, icon: Trophy, color: 'yellow' }
    ],
    badges: [
      // Badges now dynamically unlock based on the user's actual numbers
      { icon: Flame, color: 'orange', label: '7d', unlocked: currentStreak >= 7 },
      { icon: Zap, color: 'yellow', label: 'Fast', unlocked: totalShips >= 5 },
      { icon: Shield, color: 'blue', label: 'Pro', unlocked: currentLevel >= 5 },
      { icon: Trophy, color: 'gray', label: '100d', unlocked: currentStreak >= 100 },
      { icon: Crown, color: 'gray', label: 'Elite', unlocked: currentLevel >= 10 },
      { icon: Star, color: 'gray', label: 'Master', unlocked: currentLevel >= 20 },
    ]
  };

  const getStyles = (color) => colorStyles[color] || colorStyles.purple;
  const getRarityBorder = (rarity) => rarityStyles[rarity] || rarityStyles.common;

  if (isMobile) {
    return (
      <div className="bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-warning" />
          <h3 className="font-bold text-slate-800 dark:text-text-primary text-sm">Achievements</h3>
        </div>
        {achievements.recent.length > 0 && (() => {
          const achievement = achievements.recent[0];
          const IconComponent = achievement.icon;
          const styles = getStyles(achievement.color);
          return (
            <div className={`border-l-4 ${getRarityBorder(achievement.rarity)} rounded-xl mb-4 bg-slate-50 dark:bg-surface-0 border-y border-r border-slate-100 dark:border-transparent`}>
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${styles.bg} rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-text-primary text-sm truncate">{achievement.name}</p>
                    <p className="text-xs font-bold text-brand mt-0.5">+{achievement.xp} XP</p>
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
              <div key={idx} className={`w-10 h-10 rounded-xl flex items-center justify-center ${badge.unlocked ? 'bg-slate-50 dark:bg-surface-2 border border-slate-200 dark:border-transparent shadow-sm' : 'bg-slate-50 dark:bg-surface-0 opacity-40 border border-slate-100 dark:border-transparent'}`}>
                <BadgeIcon className={`w-4 h-4 ${badge.unlocked ? styles?.icon : 'text-slate-400 dark:text-text-tertiary'}`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 dark:bg-warning/10 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-orange-500 dark:text-warning" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-text-primary text-base leading-tight">Your Achievements</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary">Recent wins & milestones</p>
        </div>
      </div>

      {/* Conditionally render this so it disappears cleanly if there are no recent achievements */}
      {achievements.recent.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold text-slate-400 dark:text-text-tertiary flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-brand" />
            Recently Earned
          </h4>
          {achievements.recent.map(achievement => {
            const IconComponent = achievement.icon;
            const styles = getStyles(achievement.color);
            return (
              <div key={achievement.id} className={`group border-l-4 ${getRarityBorder(achievement.rarity)} rounded-xl bg-slate-50 dark:bg-surface-0 border-y border-r border-slate-100 dark:border-transparent hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${styles.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <IconComponent className={`w-6 h-6 ${styles.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-slate-800 dark:text-text-primary text-sm">{achievement.name}</h5>
                        <span className="text-xs font-semibold text-slate-400 dark:text-text-tertiary">{achievement.date}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-text-secondary mb-2">{achievement.description}</p>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 dark:bg-brand/10 rounded-md text-xs font-bold text-violet-700 dark:text-brand">
                        <Zap className="w-3 h-3" />
                        +{achievement.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <h4 className="text-xs font-bold text-slate-400 dark:text-text-tertiary flex items-center gap-2 uppercase tracking-wider">
          <Target className="w-3.5 h-3.5 text-blue-500 dark:text-info" />
          Next Milestones
        </h4>
        {achievements.milestones.map(milestone => {
          const IconComponent = milestone.icon;
          const styles = getStyles(milestone.color);
          const progress = milestone.target > 0 ? (milestone.current / milestone.target) * 100 : 0;
          return (
            <div key={milestone.id} className="bg-slate-50 dark:bg-surface-0 rounded-xl p-4 border border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <IconComponent className={`w-4 h-4 ${styles.icon}`} />
                <span className="font-bold text-slate-800 dark:text-text-primary text-sm">{milestone.name}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-text-tertiary">
                  <span>{milestone.current} / {milestone.target}</span>
                  <span className="text-slate-800 dark:text-text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-surface-2 rounded-full overflow-hidden">
                  <div className={`h-full ${styles.progress} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-400 dark:text-text-tertiary mb-3 uppercase tracking-wider">Badge Collection</h4>
        <div className="grid grid-cols-6 gap-3">
          {achievements.badges.map((badge, idx) => {
            const BadgeIcon = badge.icon;
            const styles = badge.unlocked ? getStyles(badge.color) : null;
            return (
              <div key={idx} className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${badge.unlocked ? 'bg-slate-50 dark:bg-surface-2 border border-slate-200 dark:border-transparent hover:border-violet-300 dark:hover:border-white/10 hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'bg-slate-50 dark:bg-surface-0 opacity-40 border border-slate-100 dark:border-transparent'}`} title={badge.unlocked ? `${badge.label} Badge` : 'Locked'}>
                <BadgeIcon className={`w-6 h-6 ${badge.unlocked ? styles?.icon : 'text-slate-400 dark:text-text-tertiary'}`} />
                {badge.unlocked && <span className="text-[10px] font-bold text-slate-500 dark:text-text-tertiary">{badge.label}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
