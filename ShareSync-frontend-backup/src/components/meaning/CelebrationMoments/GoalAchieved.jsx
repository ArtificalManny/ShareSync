// src/components/meaning/CelebrationMoments/GoalAchieved.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: Goal Achieved Celebration
// Major celebration when a goal is reached
// Includes team notification and badge unlock
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { 
  X, Flag, Trophy, Zap, Users, Star,
  Sparkles, ChevronRight, Share2, Target, Gift
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// BURST ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function BurstRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="absolute rounded-full border-2 border-cyan-500/50"
          style={{
            width: 'Available',
            height: 'Available',
            animation: `burst-ring 2s ease-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      
      <style>{`
        @keyframes burst-ring {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          Available {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE REVEAL
// ═══════════════════════════════════════════════════════════════════════════════

function BadgeReveal({ badge, delay = 0 }) {
  const [revealed, setRevealed] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!badge) return null;
  
  return (
    <div
      className={`
        p-4 rounded-xl
        bg-gradient-to-br from-purple-500/20 to-brand-500/20
        border border-purple-500/30
        transition-all duration-700
        ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-purple-500/30 flex items-center justify-center">
            <span className="text-3xl">{badge.icon || '🏆'}</span>
          </div>
          {revealed && (
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warning-400 animate-pulse" />
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs text-purple-400 mb-0.5 flex items-center gap-1">
            <Gift className="w-3 h-3" />
            Badge Unlocked!
          </div>
          <div className="font-bold text-text-primary">{badge.name}</div>
          <div className="text-xs text-text-tertiary">{badge.description}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM NOTIFICATION PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════

function TeamNotificationPreview({ teamMembers = [], userName }) {
  if (teamMembers.length === 0) return null;
  
  return (
    <div className="
      p-3 rounded-xl bg-surface-1/50 border border-white/[0.06]
      text-left
    ">
      <div className="text-xs text-text-tertiary mb-2">📢 Team will be notified</div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {teamMembers.slice(0, 4).map((member, idx) => (
            <div
              key={member.id || idx}
              className="w-7 h-7 rounded-full bg-surface-2 border-2 border-surface-1 flex items-center justify-center"
              title={member.name}
            >
              <span className="text-xs">{member.avatar || member.name?.charAt(0)}</span>
            </div>
          ))}
        </div>
        {teamMembers.length > 4 && (
          <span className="text-xs text-text-tertiary">+{teamMembers.length - 4} more</span>
        )}
        <span className="text-xs text-text-secondary flex-1 truncate">
          "{userName} achieved {'{goal}'}!"
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GoalAchievedCelebration - Celebration modal for goal completion
 */
export function GoalAchievedCelebration({
  isOpen,
  onClose,
  goal,
  badge,
  stats = {},
  teamMembers = [],
  userName = 'You',
}) {
  const [animationPhase, setAnimationPhase] = useState(0);
  
  const {
    xpEarned = 0,
    daysToComplete = 0,
    tasksCompleted = 0,
    objectivesCompleted = 0,
  } = stats;
  
  // Animate in phases
  useEffect(() => {
    if (isOpen) {
      const timers = [
        setTimeout(() => setAnimationPhase(1), 100),
        setTimeout(() => setAnimationPhase(2), 600),
        setTimeout(() => setAnimationPhase(3), 1100),
        setTimeout(() => setAnimationPhase(4), 1600),
      ];
      
      return () => timers.forEach(clearTimeout);
    } else {
      setAnimationPhase(0);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="
        relative z-10 w-full max-w-md
        bg-surface-0 border border-white/[0.08] rounded-2xl
        overflow-hidden
      ">
        {/* Header with burst */}
        <div className="relative h-40 bg-gradient-to-b from-cyan-500/20 to-transparent overflow-hidden">
          <BurstRings />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-surface-0/50 hover:bg-surface-0 transition-colors z-10"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
          
          {/* Flag icon */}
          <div
            className={`
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              transition-all duration-700 ease-out
              ${animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
            `}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                <Flag className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-warning-500 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <div
            className={`
              text-center mb-6
              transition-all duration-500
              ${animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Goal Achieved! 🎯
            </h2>
            <p className="text-lg text-cyan-400 font-medium">
              {goal?.title || 'Goal'}
            </p>
          </div>
          
          {/* Stats */}
          <div
            className={`
              grid grid-cols-3 gap-3 mb-6
              transition-all duration-500 delay-100
              ${animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <div className="text-center p-3 rounded-xl bg-surface-1">
              <div className="text-lg font-bold text-success-400">+{xpEarned}</div>
              <div className="text-xs text-text-tertiary">XP Earned</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-surface-1">
              <div className="text-lg font-bold text-text-primary">{daysToComplete}</div>
              <div className="text-xs text-text-tertiary">Days</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-surface-1">
              <div className="text-lg font-bold text-brand-400">{tasksCompleted}</div>
              <div className="text-xs text-text-tertiary">Tasks</div>
            </div>
          </div>
          
          {/* Badge */}
          {badge && (
            <div
              className={`
                mb-6
                transition-all duration-500 delay-200
                ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <BadgeReveal badge={badge} delay={animationPhase >= 3 ? 500 : 0} />
            </div>
          )}
          
          {/* Team notification */}
          <div
            className={`
              mb-6
              transition-all duration-500 delay-300
              ${animationPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <TeamNotificationPreview 
              teamMembers={teamMembers} 
              userName={userName}
            />
          </div>
          
          {/* Actions */}
          <div
            className={`
              flex gap-3
              transition-all duration-500 delay-400
              ${animationPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <button
              onClick={onClose}
              className="
                flex-1 py-3 rounded-xl
                bg-cyan-500 text-white font-medium
                hover:bg-cyan-400 transition-colors
                flex items-center justify-center gap-2
              "
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              className="
                px-4 py-3 rounded-xl
                bg-surface-1 text-text-secondary
                border border-white/[0.06]
                hover:bg-surface-2 transition-colors
              "
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalAchievedCelebration;
