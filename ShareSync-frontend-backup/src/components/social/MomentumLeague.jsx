// src/components/social/MomentumLeague.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Momentum League
// ═══════════════════════════════════════════════════════════════════════════════
//
// Weekly league tiers that reset and create urgency.
// Creates FOMO by showing tier progression and demotion risk.
//
// League Tiers:
// - Bronze (0-499 XP)
// - Silver (500-999 XP)
// - Gold (1000-1999 XP)
// - Platinum (2000-3499 XP)
// - Diamond (3500+ XP)
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Shield,
  Crown,
  Star,
  Gem,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// LEAGUE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const LEAGUES = {
  bronze: {
    name: 'Bronze',
    icon: Shield,
    minXP: 0,
    maxXP: 499,
    color: 'text-amber-600',
    bg: 'bg-amber-600/10',
    border: 'border-amber-600/20',
    gradient: 'from-amber-700 to-amber-500',
    glow: 'shadow-amber-500/20',
    percentile: 'Bottom 40%',
  },
  silver: {
    name: 'Silver',
    icon: Star,
    minXP: 500,
    maxXP: 999,
    color: 'text-slate-300',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/20',
    gradient: 'from-slate-500 to-slate-300',
    glow: 'shadow-slate-400/20',
    percentile: 'Top 60%',
  },
  gold: {
    name: 'Gold',
    icon: Trophy,
    minXP: 1000,
    maxXP: 1999,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    gradient: 'from-yellow-600 to-yellow-400',
    glow: 'shadow-yellow-500/30',
    percentile: 'Top 30%',
  },
  platinum: {
    name: 'Platinum',
    icon: Gem,
    minXP: 2000,
    maxXP: 3499,
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    gradient: 'from-cyan-500 to-cyan-300',
    glow: 'shadow-cyan-500/30',
    percentile: 'Top 15%',
  },
  diamond: {
    name: 'Diamond',
    icon: Crown,
    minXP: 3500,
    maxXP: Infinity,
    color: 'text-brand-300',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    gradient: 'from-brand-500 to-brand-300',
    glow: 'shadow-brand-500/40',
    percentile: 'Top 5%',
  },
};

const LEAGUE_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const getLeagueFromXP = (xp) => {
  for (const key of [...LEAGUE_ORDER].reverse()) {
    if (xp >= LEAGUES[key].minXP) {
      return key;
    }
  }
  return 'bronze';
};

const getTimeUntilReset = () => {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);
  
  const diff = nextMonday - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return { days, hours, total: diff };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEAGUE BADGE
// ═══════════════════════════════════════════════════════════════════════════════
const LeagueBadge = ({ league, size = 'md', showLabel = true, animate = false }) => {
  const config = LEAGUES[league] || LEAGUES.bronze;
  const Icon = config.icon;
  
  const sizes = {
    sm: { badge: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
    md: { badge: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-sm' },
    lg: { badge: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-base' },
    xl: { badge: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-lg' },
  };
  
  const sizeConfig = sizes[size];
  
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={animate ? { 
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        } : {}}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className={`
          ${sizeConfig.badge} rounded-xl
          bg-gradient-to-br ${config.gradient}
          flex items-center justify-center
          shadow-lg ${config.glow}
          ${league === 'diamond' ? 'ring-2 ring-brand-400/30' : ''}
        `}
      >
        <Icon className={`${sizeConfig.icon} text-white drop-shadow-lg`} />
      </motion.div>
      
      {showLabel && (
        <span className={`font-semibold ${sizeConfig.text} ${config.color}`}>
          {config.name}
        </span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS TO NEXT LEAGUE
// ═══════════════════════════════════════════════════════════════════════════════
const LeagueProgress = ({ currentXP, currentLeague }) => {
  const config = LEAGUES[currentLeague];
  const currentIndex = LEAGUE_ORDER.indexOf(currentLeague);
  const nextLeague = currentIndex < LEAGUE_ORDER.length - 1 
    ? LEAGUE_ORDER[currentIndex + 1] 
    : null;
  
  if (!nextLeague) {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-400">
        <Crown className="w-4 h-4" />
        <span>You've reached the top!</span>
      </div>
    );
  }
  
  const nextConfig = LEAGUES[nextLeague];
  const progress = ((currentXP - config.minXP) / (nextConfig.minXP - config.minXP)) * 100;
  const xpNeeded = nextConfig.minXP - currentXP;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={config.color}>{config.name}</span>
        <span className="text-text-tertiary">{xpNeeded} XP to {nextConfig.name}</span>
        <span className={nextConfig.color}>{nextConfig.name}</span>
      </div>
      
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
        />
      </div>
      
      <p className="text-xs text-text-tertiary text-center">
        {currentXP.toLocaleString()} / {nextConfig.minXP.toLocaleString()} XP
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMOTION WARNING
// ═══════════════════════════════════════════════════════════════════════════════
const DemotionWarning = ({ currentLeague, currentXP, previousXP }) => {
  const config = LEAGUES[currentLeague];
  const currentIndex = LEAGUE_ORDER.indexOf(currentLeague);
  
  if (currentIndex === 0) return null; // Can't demote from Bronze
  
  const prevLeague = LEAGUE_ORDER[currentIndex - 1];
  const prevConfig = LEAGUES[prevLeague];
  const xpAboveDemotion = currentXP - config.minXP;
  const isAtRisk = xpAboveDemotion < 100; // Within 100 XP of demotion
  
  if (!isAtRisk) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-energy-500/10 border border-energy-500/20"
    >
      <div className="flex items-center gap-2 text-energy-500 mb-1">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">Demotion Risk!</span>
      </div>
      <p className="text-xs text-text-secondary">
        You're only <strong>{xpAboveDemotion} XP</strong> above {prevConfig.name}. 
        Keep shipping to stay in {config.name}!
      </p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEAGUE TIER LADDER
// ═══════════════════════════════════════════════════════════════════════════════
const LeagueLadder = ({ currentLeague, currentXP }) => {
  return (
    <div className="space-y-2">
      {[...LEAGUE_ORDER].reverse().map((league, i) => {
        const config = LEAGUES[league];
        const Icon = config.icon;
        const isCurrent = league === currentLeague;
        const isAbove = LEAGUE_ORDER.indexOf(league) > LEAGUE_ORDER.indexOf(currentLeague);
        const isBelow = LEAGUE_ORDER.indexOf(league) < LEAGUE_ORDER.indexOf(currentLeague);
        
        return (
          <div
            key={league}
            className={`
              flex items-center gap-3 p-2 rounded-lg
              ${isCurrent ? config.bg + ' border ' + config.border : ''}
              ${isBelow ? 'opacity-50' : ''}
            `}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              ${isCurrent ? 'bg-gradient-to-br ' + config.gradient : 'bg-surface-2'}
            `}>
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : config.color}`} />
            </div>
            
            <div className="flex-1">
              <p className={`text-sm font-medium ${isCurrent ? config.color : 'text-text-secondary'}`}>
                {config.name}
                {isCurrent && <span className="ml-2 text-xs">(Current)</span>}
              </p>
              <p className="text-xs text-text-tertiary">
                {config.minXP.toLocaleString()}+ XP • {config.percentile}
              </p>
            </div>
            
            {isAbove && (
              <TrendingUp className="w-4 h-4 text-text-tertiary" />
            )}
            {isCurrent && (
              <Sparkles className="w-4 h-4 text-warning-500" />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MomentumLeague({
  // Data
  currentXP = 1250,
  previousXP = 1200,
  weeklyXP = 450,
  
  // Options
  variant = 'default', // 'default' | 'compact' | 'detailed' | 'badge-only'
  showProgress = true,
  showTimer = true,
  showLadder = false,
  showDemotionWarning = true,
  
  // Actions
  onViewDetails,
  
  // Styling
  className = '',
}) {
  // Get momentum context
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {}
  
  const { isFireMode } = momentumContext;

  const currentLeague = useMemo(() => getLeagueFromXP(currentXP), [currentXP]);
  const config = LEAGUES[currentLeague];
  const timeUntilReset = useMemo(() => getTimeUntilReset(), []);
  
  // Determine trend
  const trend = currentXP > previousXP ? 'up' : currentXP < previousXP ? 'down' : 'same';

  // Badge only variant
  if (variant === 'badge-only') {
    return <LeagueBadge league={currentLeague} size="md" animate={isFireMode} />;
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={onViewDetails}
        className={`
          flex items-center gap-3 p-3 rounded-xl
          ${config.bg} border ${config.border}
          hover:bg-opacity-80 transition-colors
          ${className}
        `}
      >
        <LeagueBadge league={currentLeague} size="sm" showLabel={false} />
        
        <div className="flex-1 text-left">
          <p className={`text-sm font-semibold ${config.color}`}>
            {config.name} League
          </p>
          <p className="text-xs text-text-tertiary">
            {currentXP.toLocaleString()} XP
          </p>
        </div>
        
        {showTimer && (
          <div className="text-right">
            <p className="text-xs text-text-tertiary">Resets in</p>
            <p className="text-sm font-medium text-text-secondary">
              {timeUntilReset.days}d {timeUntilReset.hours}h
            </p>
          </div>
        )}
      </button>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
        {/* Header */}
        <div className={`p-4 ${config.bg} border-b ${config.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LeagueBadge league={currentLeague} size="md" showLabel={false} animate />
              <div>
                <h3 className={`text-lg font-bold ${config.color}`}>{config.name} League</h3>
                <p className="text-sm text-text-secondary">{config.percentile}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-text-primary">{currentXP.toLocaleString()}</p>
              <div className="flex items-center justify-end gap-1 text-xs">
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-success" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-energy-500" />}
                <span className={trend === 'up' ? 'text-success' : trend === 'down' ? 'text-energy-500' : 'text-text-tertiary'}>
                  {trend === 'up' ? '+' : ''}{currentXP - previousXP} this session
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Progress */}
          {showProgress && (
            <LeagueProgress currentXP={currentXP} currentLeague={currentLeague} />
          )}
          
          {/* Demotion warning */}
          {showDemotionWarning && (
            <DemotionWarning 
              currentLeague={currentLeague} 
              currentXP={currentXP}
              previousXP={previousXP}
            />
          )}
          
          {/* Weekly stats */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-text-secondary">This week</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">
              +{weeklyXP.toLocaleString()} XP
            </span>
          </div>
          
          {/* Timer */}
          {showTimer && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">League resets in</span>
              </div>
              <span className="text-sm font-semibold text-warning-500">
                {timeUntilReset.days}d {timeUntilReset.hours}h
              </span>
            </div>
          )}
          
          {/* Ladder */}
          {showLadder && (
            <div className="pt-4 border-t border-white/[0.06]">
              <h4 className="text-sm font-medium text-text-secondary mb-3">All Leagues</h4>
              <LeagueLadder currentLeague={currentLeague} currentXP={currentXP} />
            </div>
          )}
        </div>
        
        {/* View details */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="
              w-full py-3 border-t border-white/[0.06]
              text-sm text-text-tertiary hover:text-brand-400
              flex items-center justify-center gap-1
              transition-colors
            "
          >
            View league details <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`p-4 rounded-xl ${config.bg} border ${config.border} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <LeagueBadge league={currentLeague} size="sm" showLabel={false} animate={isFireMode} />
          <div>
            <h3 className={`text-sm font-semibold ${config.color}`}>{config.name} League</h3>
            <p className="text-xs text-text-tertiary">{config.percentile}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className={`text-lg font-bold ${config.color}`}>{currentXP.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">XP</p>
        </div>
      </div>
      
      {/* Progress */}
      {showProgress && (
        <div className="mb-4">
          <LeagueProgress currentXP={currentXP} currentLeague={currentLeague} />
        </div>
      )}
      
      {/* Timer */}
      {showTimer && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-text-tertiary">
            <Clock className="w-3 h-3" />
            Resets in
          </span>
          <span className="font-medium text-warning-500">
            {timeUntilReset.days}d {timeUntilReset.hours}h
          </span>
        </div>
      )}
      
      {/* View details link */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="
            w-full mt-4 pt-3 border-t border-white/[0.06]
            text-xs text-text-tertiary hover:text-brand-400
            flex items-center justify-center gap-1
            transition-colors
          "
        >
          View details <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI LEAGUE INDICATOR (for sidebar)
// ═══════════════════════════════════════════════════════════════════════════════
export function MiniLeagueIndicator({ currentXP = 1250, onClick, className = '' }) {
  const currentLeague = getLeagueFromXP(currentXP);
  const config = LEAGUES[currentLeague];
  const Icon = config.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${config.bg} border ${config.border}
        hover:bg-opacity-80 transition-colors
        ${className}
      `}
    >
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.name}</span>
    </button>
  );
}
