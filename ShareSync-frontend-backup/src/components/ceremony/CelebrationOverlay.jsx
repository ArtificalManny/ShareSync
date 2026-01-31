// src/components/ceremony/CelebrationOverlay.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY MOMENTS: Celebration Overlay
// Visual celebrations for task completions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useMemo } from 'react';
import { 
  CheckCircle2, Zap, Star, Trophy, Rocket, Crown,
  Sparkles, PartyPopper, Lock, Users, X
} from 'lucide-react';
import { CELEBRATION_TIERS, TIER_CONFIG } from '../../hooks/useCeremony';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function Confetti({ count = 50, duration = 3000, colors }) {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const defaultColors = ['#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];
    const confettiColors = colors || defaultColors;
    
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1000,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
    }));
    
    setParticles(newParticles);
    
    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [count, duration, colors]);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}ms`,
            '--rotation': `${particle.rotation}deg`,
          }}
        >
          <div
            className={particle.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MICRO CELEBRATION (Checkmark)
// ═══════════════════════════════════════════════════════════════════════════════

function MicroCelebration({ celebration, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, celebration.config.duration);
    return () => clearTimeout(timer);
  }, [celebration, onClose]);
  
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success-500/20 border border-success-500/30 backdrop-blur-sm">
        <CheckCircle2 className="w-5 h-5 text-success-400 animate-scale-check" />
        <span className="text-sm text-success-400">+{celebration.xp} XP</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD CELEBRATION (Confetti burst)
// ═══════════════════════════════════════════════════════════════════════════════

function StandardCelebration({ celebration, onClose }) {
  return (
    <>
      <Confetti count={30} duration={celebration.config.duration} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="animate-in zoom-in duration-300 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <CheckCircle2 className="w-10 h-10 text-brand-400" />
          </div>
          
          <div className="text-2xl font-bold text-text-primary mb-2">
            Task Complete!
          </div>
          
          <div className="flex items-center justify-center gap-2 text-lg text-brand-400">
            <Zap className="w-5 h-5" />
            <span>+{celebration.xp} XP</span>
            {celebration.variableRewards.bonusXP && (
              <span className="px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-400 text-sm">
                Bonus! x{celebration.variableRewards.bonusMultiplier}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKING CELEBRATION (Unlocker)
// ═══════════════════════════════════════════════════════════════════════════════

function BlockingCelebration({ celebration, onClose }) {
  return (
    <>
      <Confetti count={40} duration={celebration.config.duration} colors={['#06B6D4', '#0891B2', '#22D3EE', '#7C3AED']} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="animate-in zoom-in duration-500 text-center max-w-md">
          <div className="w-24 h-24 rounded-2xl bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <Lock className="w-12 h-12 text-cyan-400" />
          </div>
          
          <div className="text-3xl font-bold text-text-primary mb-2">
            Team Unlocker! 🔓
          </div>
          
          <div className="text-lg text-cyan-400 mb-4">
            You unblocked {celebration.unblockedCount} teammate{celebration.unblockedCount !== 1 ? 's' : ''}!
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xl text-brand-400">
            <Zap className="w-6 h-6" />
            <span>+{celebration.xp} XP</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT GOAL CELEBRATION (Screen takeover)
// ═══════════════════════════════════════════════════════════════════════════════

function SprintGoalCelebration({ celebration, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <Confetti count={80} duration={celebration.config.duration} />
      
      <div className="animate-in zoom-in duration-500 text-center max-w-lg p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full animate-pulse" />
          
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/50">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            
            <div className="text-4xl font-bold text-white mb-4">
              Sprint Goal Achieved! 🎯
            </div>
            
            <div className="text-xl text-text-secondary mb-6">
              "{celebration.task.title}"
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/20 text-brand-400">
                <Zap className="w-5 h-5" />
                <span className="text-xl font-bold">+{celebration.xp} XP</span>
              </div>
              {celebration.variableRewards.bonusXP && (
                <div className="px-4 py-2 rounded-xl bg-warning-500/20 text-warning-400">
                  🎲 Bonus x{celebration.variableRewards.bonusMultiplier}
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SHIP CELEBRATION (Full ceremony)
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectShipCelebration({ celebration, onClose, claps = [] }) {
  const [showClaps, setShowClaps] = useState(true);
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center overflow-hidden">
      <Confetti count={150} duration={celebration.config.duration} />
      
      {/* Champagne effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="w-4 h-64 bg-gradient-to-b from-warning-400 to-transparent opacity-50 animate-champagne" />
      </div>
      
      <div className="animate-in zoom-in duration-700 text-center max-w-2xl p-8 relative">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full animate-pulse" />
        
        <div className="relative">
          {/* Icon */}
          <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
            <Rocket className="w-20 h-20 text-white" />
          </div>
          
          {/* Title */}
          <div className="text-5xl font-bold text-white mb-4 animate-shimmer">
            🚀 PROJECT SHIPPED! 🚀
          </div>
          
          {/* Task name */}
          <div className="text-2xl text-text-secondary mb-8">
            "{celebration.task.title}"
          </div>
          
          {/* XP and rewards */}
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500/20 text-brand-400">
              <Zap className="w-6 h-6" />
              <span className="text-2xl font-bold">+{celebration.xp} XP</span>
            </div>
            {celebration.variableRewards.luckyStreak && (
              <div className="px-6 py-3 rounded-2xl bg-success-500/20 text-success-400">
                🍀 Lucky Streak x{celebration.variableRewards.streakMultiplier}
              </div>
            )}
          </div>
          
          {/* Team claps */}
          {claps.length > 0 && showClaps && (
            <div className="mb-8">
              <div className="text-sm text-text-tertiary mb-2">Team is celebrating!</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {claps.map(clap => (
                  <div
                    key={clap.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 animate-in zoom-in"
                  >
                    <span className="text-lg">👏</span>
                    <span className="text-sm text-text-secondary">{clap.fromUser.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Added to Hall of Fame */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning-500/20 text-warning-400">
              <Star className="w-4 h-4 fill-warning-400" />
              <span>Added to Hall of Fame</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-500 text-white font-bold text-lg hover:from-brand-400 hover:to-purple-400 transition-all shadow-xl shadow-brand-500/30"
          >
            🎉 Celebrate!
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGENDARY CELEBRATION (Rare!)
// ═══════════════════════════════════════════════════════════════════════════════

function LegendaryCelebration({ celebration, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      <Confetti count={200} duration={celebration.config.duration} colors={['#FFD700', '#FFA500', '#FFE4B5', '#FFFACD']} />
      
      {/* Golden rays */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent,#FFD70020,transparent,#FFD70020,transparent)] animate-spin-slow" />
      </div>
      
      <div className="animate-in zoom-in duration-1000 text-center max-w-2xl p-8 relative">
        <div className="relative">
          {/* Crown icon */}
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-yellow-500/50 animate-pulse-glow-gold">
            <Crown className="w-24 h-24 text-white" />
          </div>
          
          <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-4 animate-shimmer">
            ⭐ LEGENDARY SHIP! ⭐
          </div>
          
          <div className="text-xl text-yellow-400 mb-4">
            1 in 100 chance achieved!
          </div>
          
          <div className="text-2xl text-text-secondary mb-8">
            "{celebration.task.title}"
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
              <Sparkles className="w-8 h-8" />
              <span className="text-3xl font-bold">+{celebration.xp} XP</span>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/50">
              <Star className="w-5 h-5 fill-yellow-400" />
              <span className="font-bold">LEGENDARY BADGE UNLOCKED</span>
              <Star className="w-5 h-5 fill-yellow-400" />
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="px-12 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-xl hover:from-yellow-400 hover:to-orange-400 transition-all shadow-xl shadow-yellow-500/50"
          >
            👑 Claim Your Legend
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CELEBRATION OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CelebrationOverlay - Renders appropriate celebration based on tier
 */
export function CelebrationOverlay({
  celebration,
  claps = [],
  onClose,
}) {
  if (!celebration) return null;
  
  const CelebrationComponent = {
    [CELEBRATION_TIERS.MICRO]: MicroCelebration,
    [CELEBRATION_TIERS.STANDARD]: StandardCelebration,
    [CELEBRATION_TIERS.BLOCKING]: BlockingCelebration,
    [CELEBRATION_TIERS.SPRINT_GOAL]: SprintGoalCelebration,
    [CELEBRATION_TIERS.PROJECT_SHIP]: ProjectShipCelebration,
    [CELEBRATION_TIERS.LEGENDARY]: LegendaryCelebration,
  }[celebration.tier] || StandardCelebration;
  
  return (
    <CelebrationComponent
      celebration={celebration}
      claps={claps}
      onClose={onClose}
    />
  );
}

export default CelebrationOverlay;
