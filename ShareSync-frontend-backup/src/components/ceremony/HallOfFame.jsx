// src/components/ceremony/HallOfFame.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY MOMENTS: Hall of Fame
// Showcase of major achievements and ships
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  Trophy, Star, Rocket, Crown, Award, Calendar,
  ChevronRight, Filter, Sparkles, Zap
} from 'lucide-react';
import { CELEBRATION_TIERS, BADGE_TYPES } from '../../hooks/useCeremony';

// ═══════════════════════════════════════════════════════════════════════════════
// FAME ENTRY CARD
// ═══════════════════════════════════════════════════════════════════════════════

function FameEntryCard({ entry }) {
  const tierIcons = {
    [CELEBRATION_TIERS.SPRINT_GOAL]: { icon: Trophy, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    [CELEBRATION_TIERS.PROJECT_SHIP]: { icon: Rocket, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    [CELEBRATION_TIERS.LEGENDARY]: { icon: Crown, color: 'text-warning-400', bg: 'bg-warning-500/10' },
  };
  
  const config = tierIcons[entry.tier] || tierIcons[CELEBRATION_TIERS.SPRINT_GOAL];
  const Icon = config.icon;
  
  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
  
  return (
    <div className={`
      p-4 rounded-xl border transition-all duration-200
      ${entry.isLegendary 
        ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
        : `${config.bg} border-white/[0.06]`
      }
      hover:scale-[1.02]
    `}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${entry.isLegendary ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : config.bg}
        `}>
          <Icon className={`w-6 h-6 ${entry.isLegendary ? 'text-white' : config.color}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {entry.isLegendary && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                LEGENDARY
              </span>
            )}
            <span className="text-xs text-text-tertiary">{formattedDate}</span>
          </div>
          
          <div className="text-sm font-medium text-text-primary truncate mb-1">
            {entry.task?.title}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-brand-400">
              <Zap className="w-3 h-3" />
              <span>+{entry.xp} XP</span>
            </div>
          </div>
        </div>
        
        {entry.isLegendary && (
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════

function BadgeShowcase({ earnedBadges, allBadges }) {
  const badges = useMemo(() => {
    return Object.values(allBadges).map(badge => ({
      ...badge,
      earned: earnedBadges.includes(badge.id),
    }));
  }, [earnedBadges, allBadges]);
  
  return (
    <div className="mb-6">
      <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
        Badges ({earnedBadges.length}/{badges.length})
      </div>
      
      <div className="flex flex-wrap gap-3">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-2xl
              transition-all duration-200
              ${badge.earned 
                ? 'bg-warning-500/10 border border-warning-500/30 shadow-lg shadow-warning-500/20' 
                : 'bg-surface-2 border border-white/[0.06] opacity-40 grayscale'
              }
            `}
            title={`${badge.name}: ${badge.description}`}
          >
            {badge.earned ? badge.icon : '🔒'}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HALL OF FAME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HallOfFame - Full achievement showcase
 */
export function HallOfFame({
  hallOfFame = [],
  earnedBadges = [],
  allBadges = BADGE_TYPES,
  userName = 'User',
  className = '',
}) {
  const [filter, setFilter] = useState('all'); // all, legendary, sprint, project
  
  const filteredEntries = useMemo(() => {
    if (filter === 'all') return hallOfFame;
    if (filter === 'legendary') return hallOfFame.filter(e => e.isLegendary);
    if (filter === 'sprint') return hallOfFame.filter(e => e.tier === CELEBRATION_TIERS.SPRINT_GOAL);
    if (filter === 'project') return hallOfFame.filter(e => e.tier === CELEBRATION_TIERS.PROJECT_SHIP);
    return hallOfFame;
  }, [hallOfFame, filter]);
  
  // Stats
  const stats = useMemo(() => ({
    totalShips: hallOfFame.length,
    legendaryCount: hallOfFame.filter(e => e.isLegendary).length,
    totalXP: hallOfFame.reduce((sum, e) => sum + e.xp, 0),
  }), [hallOfFame]);
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-warning-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-warning-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Hall of Fame
              </div>
              <div className="text-sm text-text-tertiary">
                {userName}'s greatest achievements
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xl font-bold text-warning-400">{stats.totalShips}</div>
              <div className="text-xs text-text-tertiary">ships</div>
            </div>
            {stats.legendaryCount > 0 && (
              <div>
                <div className="text-xl font-bold text-yellow-400">{stats.legendaryCount}</div>
                <div className="text-xs text-text-tertiary">legendary</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Badge showcase */}
        <BadgeShowcase earnedBadges={earnedBadges} allBadges={allBadges} />
        
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-text-tertiary" />
          {['all', 'legendary', 'sprint', 'project'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-colors
                ${filter === f 
                  ? 'bg-brand-500/10 text-brand-400' 
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Entries list */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredEntries.length > 0 ? (
            filteredEntries.map(entry => (
              <FameEntryCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="py-12 text-center">
              <Trophy className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <div className="text-sm text-text-tertiary">
                {filter === 'all' 
                  ? 'No major ships yet. Keep building!'
                  : `No ${filter} ships yet`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI FAME WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniFameWidget - Compact fame preview for dashboard
 */
export function MiniFameWidget({
  hallOfFame = [],
  earnedBadges = [],
  onClick,
  className = '',
}) {
  const recentEntry = hallOfFame[0];
  const legendaryCount = hallOfFame.filter(e => e.isLegendary).length;
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left group
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning-400" />
          <span className="text-sm font-medium text-text-primary">Hall of Fame</span>
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
      </div>
      
      <div className="flex items-center gap-4 mb-3">
        <div>
          <div className="text-2xl font-bold text-warning-400">{hallOfFame.length}</div>
          <div className="text-xs text-text-tertiary">ships</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-brand-400">{earnedBadges.length}</div>
          <div className="text-xs text-text-tertiary">badges</div>
        </div>
        {legendaryCount > 0 && (
          <div>
            <div className="text-2xl font-bold text-yellow-400">{legendaryCount}</div>
            <div className="text-xs text-text-tertiary">legendary</div>
          </div>
        )}
      </div>
      
      {recentEntry && (
        <div className="text-xs text-text-tertiary truncate">
          Latest: {recentEntry.task?.title}
        </div>
      )}
    </button>
  );
}

export default HallOfFame;
