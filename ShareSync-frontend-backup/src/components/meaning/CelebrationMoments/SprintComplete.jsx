// src/components/meaning/CelebrationMoments/SprintComplete.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: Sprint Complete Celebration
// Full-screen celebration when a sprint is completed
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { 
  X, Trophy, Zap, Users, CheckCircle2, Star,
  Sparkles, ChevronRight, Share2, TrendingUp
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI RAIN
// ═══════════════════════════════════════════════════════════════════════════════

function ConfettiRain({ count = 50 }) {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const colors = ['#7C3AED', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#8B5CF6'];
    const newParticles = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      });
    }
    
    setParticles(newParticles);
  }, [count]);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s infinite`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          Available {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT PILL
// ═══════════════════════════════════════════════════════════════════════════════

function StatPill({ icon: Icon, value, label, color = 'brand' }) {
  const colorClasses = {
    brand: 'bg-brand-500/20 text-brand-400',
    success: 'bg-success-500/20 text-success-400',
    warning: 'bg-warning-500/20 text-warning-500',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };
  
  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded-full
      ${colorClasses[color]}
    `}>
      <Icon className="w-4 h-4" />
      <span className="font-bold">{value}</span>
      <span className="text-sm opacity-70">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SprintCompleteCelebration - Full-screen sprint completion celebration
 */
export function SprintCompleteCelebration({
  isOpen,
  onClose,
  sprint,
  stats = {},
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  const {
    tasksCompleted = 0,
    totalTasks = 0,
    xpEarned = 0,
    teamMembers = [],
    daysAhead = 0, // negative if late
    topContributor = null,
  } = stats;
  
  const completionRate = totalTasks > 0 
    ? Math.round((tasksCompleted / totalTasks) * 100) 
    : 0;
  
  // Animate in phases
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      
      const timers = [
        setTimeout(() => setAnimationPhase(1), 300),
        setTimeout(() => setAnimationPhase(2), 800),
        setTimeout(() => setAnimationPhase(3), 1300),
      ];
      
      return () => timers.forEach(clearTimeout);
    } else {
      setAnimationPhase(0);
      setShowConfetti(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-surface-0/95 via-brand-950/80 to-surface-0/95 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Confetti */}
      {showConfetti && <ConfettiRain count={80} />}
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-4 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Trophy animation */}
        <div
          className={`
            mb-6 transition-all duration-700 ease-out
            ${animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
          `}
        >
          <div className="relative inline-block">
            {/* Glow */}
            <div className="absolute inset-0 w-24 h-24 bg-warning-500/30 rounded-full blur-xl animate-pulse" />
            
            {/* Trophy icon */}
            <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center shadow-2xl shadow-warning-500/50">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            
            {/* Sparkles */}
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-warning-400 animate-pulse" />
            <Star className="absolute -bottom-1 -left-3 w-6 h-6 text-brand-400 animate-bounce" />
          </div>
        </div>
        
        {/* Title */}
        <h1
          className={`
            text-4xl font-bold text-text-primary mb-2
            transition-all duration-500 delay-200
            ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          Sprint Complete! 🎉
        </h1>
        
        {/* Sprint name */}
        <p
          className={`
            text-xl text-brand-400 mb-6
            transition-all duration-500 delay-300
            ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          {sprint?.name || 'Sprint'}
        </p>
        
        {/* Stats pills */}
        <div
          className={`
            flex flex-wrap justify-center gap-3 mb-8
            transition-all duration-500 delay-500
            ${animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <StatPill
            icon={CheckCircle2}
            value={`${completionRate}%`}
            label="completed"
            color="success"
          />
          <StatPill
            icon={Zap}
            value={`+${xpEarned}`}
            label="XP"
            color="warning"
          />
          {teamMembers.length > 0 && (
            <StatPill
              icon={Users}
              value={teamMembers.length}
              label="contributors"
              color="cyan"
            />
          )}
          {daysAhead !== 0 && (
            <StatPill
              icon={TrendingUp}
              value={Math.abs(daysAhead)}
              label={daysAhead > 0 ? 'days early!' : 'days late'}
              color={daysAhead > 0 ? 'success' : 'brand'}
            />
          )}
        </div>
        
        {/* Top contributor */}
        {topContributor && (
          <div
            className={`
              mb-8 p-4 rounded-xl bg-surface-1/50 border border-white/[0.06]
              transition-all duration-500 delay-700
              ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <div className="text-sm text-text-tertiary mb-2">🌟 MVP of the Sprint</div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                <span className="text-lg">{topContributor.avatar || '👤'}</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-text-primary">{topContributor.name}</div>
                <div className="text-xs text-text-tertiary">
                  {topContributor.tasksCompleted} tasks · +{topContributor.xp} XP
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div
          className={`
            flex flex-col sm:flex-row gap-3 justify-center
            transition-all duration-500 delay-900
            ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <button
            onClick={onClose}
            className="
              px-6 py-3 rounded-xl
              bg-brand-500 text-white font-medium
              hover:bg-brand-400 transition-colors
              flex items-center justify-center gap-2
            "
          >
            <span>Start Next Sprint</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            className="
              px-6 py-3 rounded-xl
              bg-surface-1 text-text-secondary font-medium
              border border-white/[0.06]
              hover:bg-surface-2 transition-colors
              flex items-center justify-center gap-2
            "
          >
            <Share2 className="w-4 h-4" />
            <span>Share Victory</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SprintCompleteCelebration;
