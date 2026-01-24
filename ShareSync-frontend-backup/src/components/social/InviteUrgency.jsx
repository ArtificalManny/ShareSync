// src/components/social/InviteUrgency.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Invite Urgency
// ═══════════════════════════════════════════════════════════════════════════════
//
// Scarcity and urgency elements to drive team growth.
// Creates FOMO through limited spots and social proof.
//
// Key Features:
// - "X spots left" countdown
// - Recent joins social proof
// - Time-limited offers
// - Urgency messaging
// - Invite tracking
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users,
  UserPlus,
  Clock,
  Sparkles,
  AlertTriangle,
  Gift,
  Zap,
  Copy,
  Check,
  Mail,
  Link,
  ChevronRight,
  X,
  PartyPopper,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_RECENT_JOINS = [
  { id: '1', name: 'Sarah Chen', joinedAt: new Date(Date.now() - 1000 * 60 * 30), avatar: null },
  { id: '2', name: 'Alex Rivera', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), avatar: null },
  { id: '3', name: 'Jordan Park', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), avatar: null },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getUrgencyLevel = (spotsLeft, totalSpots) => {
  const ratio = spotsLeft / totalSpots;
  if (ratio <= 0.1) return 'critical'; // < 10% left
  if (ratio <= 0.3) return 'high';     // < 30% left
  if (ratio <= 0.5) return 'medium';   // < 50% left
  return 'low';
};

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN TIMER
// ═══════════════════════════════════════════════════════════════════════════════
const CountdownTimer = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = endTime - now;
      
      if (diff <= 0) {
        onExpire?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, onExpire]);
  
  const TimeUnit = ({ value, label }) => (
    <div className="text-center">
      <div className="text-lg font-bold text-text-primary tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] text-text-tertiary uppercase">{label}</div>
    </div>
  );
  
  return (
    <div className="flex items-center gap-3">
      <TimeUnit value={timeLeft.days} label="Days" />
      <span className="text-text-tertiary">:</span>
      <TimeUnit value={timeLeft.hours} label="Hrs" />
      <span className="text-text-tertiary">:</span>
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <span className="text-text-tertiary">:</span>
      <TimeUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPOTS LEFT INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════
const SpotsLeftIndicator = ({ spotsLeft, totalSpots, animate = true }) => {
  const urgency = getUrgencyLevel(spotsLeft, totalSpots);
  
  const urgencyConfig = {
    critical: { color: 'text-energy-500', bg: 'bg-energy-500', pulse: true },
    high: { color: 'text-warning-500', bg: 'bg-warning-500', pulse: true },
    medium: { color: 'text-brand-400', bg: 'bg-brand-500', pulse: false },
    low: { color: 'text-text-secondary', bg: 'bg-surface-3', pulse: false },
  };
  
  const config = urgencyConfig[urgency];
  const filledSpots = totalSpots - spotsLeft;
  
  return (
    <div className="space-y-2">
      {/* Visual spots */}
      <div className="flex gap-1">
        {Array.from({ length: totalSpots }).map((_, i) => (
          <motion.div
            key={i}
            initial={animate ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`
              w-3 h-3 rounded-full
              ${i < filledSpots ? config.bg : 'bg-surface-2 border border-white/[0.1]'}
              ${i >= filledSpots && config.pulse ? 'animate-pulse' : ''}
            `}
          />
        ))}
      </div>
      
      {/* Text */}
      <p className={`text-sm font-medium ${config.color}`}>
        {spotsLeft === 0 ? (
          'All spots filled!'
        ) : spotsLeft === 1 ? (
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Last spot remaining!
          </span>
        ) : (
          `Only ${spotsLeft} spots left this week`
        )}
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECENT JOINS SOCIAL PROOF
// ═══════════════════════════════════════════════════════════════════════════════
const RecentJoins = ({ joins = MOCK_RECENT_JOINS, maxShow = 3 }) => {
  const visibleJoins = joins.slice(0, maxShow);
  
  const getColorFromName = (name) => {
    const colors = [
      'bg-brand-500/30 text-brand-300',
      'bg-cyan-500/30 text-cyan-300',
      'bg-success-500/30 text-success-300',
      'bg-warning-500/30 text-warning-300',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };
  
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-tertiary uppercase tracking-wider">
        Recent Joins
      </p>
      
      <div className="space-y-2">
        {visibleJoins.map((join, i) => (
          <motion.div
            key={join.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            {join.avatar ? (
              <img src={join.avatar} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className={`w-6 h-6 rounded-full ${getColorFromName(join.name)} flex items-center justify-center text-[10px] font-medium`}>
                {join.name.charAt(0)}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <span className="text-sm text-text-primary">{join.name}</span>
              <span className="text-xs text-text-tertiary ml-2">
                joined {formatTimeAgo(join.joinedAt)}
              </span>
            </div>
            
            <PartyPopper className="w-3 h-3 text-warning-500" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const InviteActions = ({ inviteLink, onInviteEmail, onCopyLink }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      onCopyLink?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="flex gap-2">
      <button
        onClick={onInviteEmail}
        className="
          flex-1 flex items-center justify-center gap-2
          px-4 py-2.5 rounded-lg
          bg-brand-500 text-white text-sm font-medium
          hover:bg-brand-600 transition-colors
        "
      >
        <Mail className="w-4 h-4" />
        Invite via Email
      </button>
      
      <button
        onClick={handleCopy}
        className={`
          px-4 py-2.5 rounded-lg text-sm font-medium
          transition-all
          ${copied 
            ? 'bg-success/20 text-success' 
            : 'bg-surface-2 text-text-secondary hover:text-text-primary'
          }
        `}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Link className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BONUS XP OFFER
// ═══════════════════════════════════════════════════════════════════════════════
const BonusXPOffer = ({ xpAmount, expiresAt }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-gradient-to-br from-brand-500/20 to-cyan-500/10 border border-brand-500/30"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Limited Time Bonus</p>
          <p className="text-xs text-text-tertiary">Invite a friend and both earn</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 py-3">
        <Zap className="w-6 h-6 text-brand-400" />
        <span className="text-3xl font-bold text-brand-400">+{xpAmount}</span>
        <span className="text-lg text-text-secondary">XP</span>
      </div>
      
      {expiresAt && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p className="text-xs text-text-tertiary text-center mb-2">Offer expires in:</p>
          <div className="flex justify-center">
            <CountdownTimer endTime={expiresAt} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function InviteUrgency({
  // Data
  spotsLeft = 3,
  totalSpots = 10,
  recentJoins = MOCK_RECENT_JOINS,
  inviteLink = 'https://sharesync.app/invite/abc123',
  bonusXP = 100,
  offerExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours
  
  // Options
  variant = 'default', // 'default' | 'compact' | 'banner' | 'modal'
  showRecentJoins = true,
  showBonus = true,
  showTimer = true,
  
  // Actions
  onInviteEmail,
  onCopyLink,
  onDismiss,
  
  // Styling
  className = '',
}) {
  const urgency = getUrgencyLevel(spotsLeft, totalSpots);

  // Banner variant
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          p-4 rounded-xl
          ${urgency === 'critical' 
            ? 'bg-energy-500/10 border border-energy-500/20' 
            : 'bg-brand-500/10 border border-brand-500/20'
          }
          ${className}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${urgency === 'critical' ? 'bg-energy-500/20' : 'bg-brand-500/20'}
            `}>
              <UserPlus className={`w-5 h-5 ${urgency === 'critical' ? 'text-energy-500' : 'text-brand-400'}`} />
            </div>
            
            <div>
              <SpotsLeftIndicator spotsLeft={spotsLeft} totalSpots={totalSpots} animate={false} />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {showBonus && (
              <span className="flex items-center gap-1 text-sm text-brand-400">
                <Zap className="w-4 h-4" />
                +{bonusXP} XP bonus
              </span>
            )}
            
            <button
              onClick={onInviteEmail}
              className="
                px-4 py-2 rounded-lg
                bg-brand-500 text-white text-sm font-medium
                hover:bg-brand-600 transition-colors
              "
            >
              Invite Now
            </button>
            
            {onDismiss && (
              <button onClick={onDismiss} className="p-1 hover:bg-white/[0.1] rounded-lg">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-text-primary">Invite Friends</span>
          </div>
          {showBonus && (
            <span className="flex items-center gap-1 text-xs text-brand-400">
              <Zap className="w-3 h-3" />
              +{bonusXP} XP
            </span>
          )}
        </div>
        
        <SpotsLeftIndicator spotsLeft={spotsLeft} totalSpots={totalSpots} />
        
        <div className="mt-4">
          <InviteActions 
            inviteLink={inviteLink}
            onInviteEmail={onInviteEmail}
            onCopyLink={onCopyLink}
          />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-medium text-text-primary">Grow Your Team</h3>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="p-1 hover:bg-surface-2 rounded-lg">
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Spots indicator */}
        <SpotsLeftIndicator spotsLeft={spotsLeft} totalSpots={totalSpots} />
        
        {/* Bonus offer */}
        {showBonus && (
          <BonusXPOffer xpAmount={bonusXP} expiresAt={showTimer ? offerExpiresAt : null} />
        )}
        
        {/* Invite actions */}
        <InviteActions 
          inviteLink={inviteLink}
          onInviteEmail={onInviteEmail}
          onCopyLink={onCopyLink}
        />
        
        {/* Recent joins */}
        {showRecentJoins && recentJoins.length > 0 && (
          <div className="pt-4 border-t border-white/[0.06]">
            <RecentJoins joins={recentJoins} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE URGENCY INDICATOR (for sidebars, headers)
// ═══════════════════════════════════════════════════════════════════════════════
export function InlineInviteUrgency({ spotsLeft, totalSpots = 10, onClick, className = '' }) {
  const urgency = getUrgencyLevel(spotsLeft, totalSpots);
  
  const config = {
    critical: { color: 'text-energy-500', bg: 'bg-energy-500/10', border: 'border-energy-500/20' },
    high: { color: 'text-warning-500', bg: 'bg-warning-500/10', border: 'border-warning-500/20' },
    medium: { color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/20' },
    low: { color: 'text-text-secondary', bg: 'bg-surface-2', border: 'border-white/[0.06]' },
  };
  
  const c = config[urgency];
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${c.bg} border ${c.border}
        hover:bg-opacity-80 transition-colors
        ${className}
      `}
    >
      <UserPlus className={`w-3.5 h-3.5 ${c.color}`} />
      <span className={`text-xs font-medium ${c.color}`}>
        {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE SUCCESS TOAST
// ═══════════════════════════════════════════════════════════════════════════════
export function InviteSuccessToast({ userName, xpEarned, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="
        p-4 rounded-xl
        bg-success/10 border border-success/20
        shadow-lg shadow-success/10
      "
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
          <PartyPopper className="w-5 h-5 text-success" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">
            {userName} joined your team!
          </p>
          <p className="text-xs text-success">
            You earned +{xpEarned} XP bonus
          </p>
        </div>
        
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 hover:bg-white/[0.1] rounded-lg">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
