// src/components/ecosystem/Achievements.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Hardcoded slate/purple colors → Design tokens
// FIXED: Dynamic gradient classes → Explicit config objects
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Trophy, Star, Zap, Shield, Flame, Target, Crown, Sparkles } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

/* ─────────────────────────────────────────────────────────────────────────
   COLOR CONFIG - Tailwind-safe explicit classes
───────────────────────────────────────────────────────────────────────── */
const colorStyles = {
  orange: {
    bg: 'bg-warning/10',
    icon: 'text-warning',
    progress: 'bg-warning',
  },
  yellow: {
    bg: 'bg-warning/10',
    icon: 'text-warning',
    progress: 'bg-warning',
  },
  purple: {
    bg: 'bg-brand/10',
    icon: 'text-brand',
    progress: 'bg-brand',
  },
  blue: {
    bg: 'bg-info/10',
    icon: 'text-info',
    progress: 'bg-info',
  },
  green: {
    bg: 'bg-success/10',
    icon: 'text-success',
    progress: 'bg-success',
  },
  red: {
    bg: 'bg-danger/10',
    icon: 'text-danger',
    progress: 'bg-danger',
  },
};

const rarityStyles = {
  legendary: 'border-warning',
  epic: 'border-brand',
  rare: 'border-info',
  common: 'border-white/[0.1]',
};

const Achievements = () => {
  const isMobile = useIsMobile();

  const [achievements] = useState({
    recent: [
      {
        id: 1,
        name: '7-Day Streak',
        description: 'Ship something 7 days in a row',
        icon: Flame,
        color: 'orange',
        xp: 100,
        date: 'Today',
        rarity: 'common'
      },
      {
        id: 2,
        name: 'Quick Shipper',
        description: 'Complete 5 tasks in under 25 minutes',
        icon: Zap,
        color: 'yellow',
        xp: 50,
        date: 'Yesterday',
        rarity: 'common'
      }
    ],
    milestones: [
      { id: 1, name: 'Level 5', current: 1850, target: 2000, icon: Star, color: 'purple' },
      { id: 2, name: '30-Day Streak', current: 7, target: 30, icon: Flame, color: 'orange' },
      { id: 3, name: '100 Ships', current: 42, target: 100, icon: Trophy, color: 'yellow' }
    ],
    badges: [
      { icon: Flame, color: 'orange', label: '7d', unlocked: true },
      { icon: Zap, color: 'yellow', label: 'Fast', unlocked: true },
      { icon: Shield, color: 'blue', label: 'Protected', unlocked: true },
      { icon: Trophy, color: 'gray', label: '100d', unlocked: false },
      { icon: Crown, color: 'gray', label: 'Elite', unlocked: false },
      { icon: Star, color: 'gray', label: 'Master', unlocked: false },
    ]
  });

  const getStyles = (color) => colorStyles[color] || colorStyles.purple;
  const getRarityBorder = (rarity) => rarityStyles[rarity] || rarityStyles.common;

  /* ─────────────────────────────────────────────────────────────────────────
     MOBILE VERSION
  ───────────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-warning" />
          <h3 className="font-medium text-text-primary text-sm">Achievements</h3>
        </div>

        {/* Recent achievement */}
        {achievements.recent.length > 0 && (() => {
          const achievement = achievements.recent[0];
          const IconComponent = achievement.icon;
          const styles = getStyles(achievement.color);
          
          return (
            <div className={`border-l-2 ${getRarityBorder(achievement.rarity)} rounded-xl mb-3 bg-surface-0`}>
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${styles.bg} rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">{achievement.name}</p>
                    <p className="text-xs text-text-tertiary">+{achievement.xp} XP</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Badges */}
        <div className="flex gap-2 justify-center">
          {achievements.badges.slice(0, 6).map((badge, idx) => {
            const BadgeIcon = badge.icon;
            const styles = badge.unlocked ? getStyles(badge.color) : null;
            
            return (
              <div
                key={idx}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  badge.unlocked ? 'bg-surface-2' : 'bg-surface-0 opacity-40'
                }`}
              >
                <BadgeIcon className={`w-4 h-4 ${badge.unlocked ? styles?.icon : 'text-text-tertiary'}`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     DESKTOP VERSION
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-warning/10 rounded-lg flex items-center justify-center">
          <Trophy className="w-4 h-4 text-warning" />
        </div>
        <div>
          <h3 className="font-medium text-text-primary text-sm">Your Achievements</h3>
          <p className="text-xs text-text-tertiary">Recent wins & milestones</p>
        </div>
      </div>

      {/* Recent achievements */}
      <div className="space-y-2 mb-5">
        <h4 className="text-xs font-medium text-text-secondary flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          Recently Earned
        </h4>
        {achievements.recent.map(achievement => {
          const IconComponent = achievement.icon;
          const styles = getStyles(achievement.color);
          
          return (
            <div
              key={achievement.id}
              className={`border-l-2 ${getRarityBorder(achievement.rarity)} rounded-xl bg-surface-0`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${styles.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <IconComponent className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium text-text-primary text-sm">{achievement.name}</h5>
                      <span className="text-xs text-text-tertiary">{achievement.date}</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{achievement.description}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 rounded text-xs font-medium text-brand">
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

      {/* Milestones in progress */}
      <div className="space-y-2 mb-5">
        <h4 className="text-xs font-medium text-text-secondary flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-info" />
          Next Milestones
        </h4>
        {achievements.milestones.map(milestone => {
          const IconComponent = milestone.icon;
          const styles = getStyles(milestone.color);
          const progress = (milestone.current / milestone.target) * 100;
          
          return (
            <div key={milestone.id} className="bg-surface-0 rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-2.5 mb-2">
                <IconComponent className={`w-4 h-4 ${styles.icon}`} />
                <span className="font-medium text-text-primary text-sm">{milestone.name}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>{milestone.current} / {milestone.target}</span>
                  <span className="font-medium text-text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${styles.progress} rounded-full transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge collection */}
      <div>
        <h4 className="text-xs font-medium text-text-secondary mb-2">Badge Collection</h4>
        <div className="grid grid-cols-6 gap-2">
          {achievements.badges.map((badge, idx) => {
            const BadgeIcon = badge.icon;
            const styles = badge.unlocked ? getStyles(badge.color) : null;
            
            return (
              <div
                key={idx}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 
                  transition-all
                  ${badge.unlocked 
                    ? 'bg-surface-2 hover:bg-surface-3 cursor-pointer' 
                    : 'bg-surface-0 opacity-40'
                  }
                `}
                title={badge.unlocked ? `${badge.label} Badge` : 'Locked'}
              >
                <BadgeIcon className={`w-5 h-5 ${badge.unlocked ? styles?.icon : 'text-text-tertiary'}`} />
                {badge.unlocked && (
                  <span className="text-[10px] text-text-tertiary">{badge.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
