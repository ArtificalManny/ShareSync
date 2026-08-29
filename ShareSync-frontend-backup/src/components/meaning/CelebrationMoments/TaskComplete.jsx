// src/components/meaning/CelebrationMoments/TaskComplete.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: Task Complete Celebration
// Small, satisfying animation when a task is completed
// Scales based on task importance
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Zap, Sparkles, Star } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI PARTICLE
// ═══════════════════════════════════════════════════════════════════════════════

function ConfettiParticle({ delay, color, size, angle, distance }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        animation: `confetti-burst 0.6s ease-out ${delay}s forwards`,
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// XP FLOAT
// ═══════════════════════════════════════════════════════════════════════════════

function XPFloat({ xp, delay = 0 }) {
  return (
    <div
      className="absolute flex items-center gap-1 text-success-400 font-bold"
      style={{
        animation: `xp-float 1s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <Zap className="w-4 h-4" />
      <span>+{xp}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

const CELEBRATION_LEVELS = {
  micro: {
    name: 'Micro',
    confettiCount: 0,
    duration: 300,
    scale: 1,
    showXP: true,
  },
  small: {
    name: 'Small',
    confettiCount: 6,
    duration: 500,
    scale: 1.1,
    showXP: true,
  },
  medium: {
    name: 'Medium',
    confettiCount: 12,
    duration: 700,
    scale: 1.2,
    showXP: true,
    showStar: true,
  },
  large: {
    name: 'Large',
    confettiCount: 20,
    duration: 1000,
    scale: 1.3,
    showXP: true,
    showStar: true,
    playSound: true,
  },
  epic: {
    name: 'Epic',
    confettiCount: 30,
    duration: 1500,
    scale: 1.5,
    showXP: true,
    showStar: true,
    playSound: true,
    screenFlash: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const CONFETTI_COLORS = [
  '#7C3AED', // brand purple
  '#10B981', // success green
  '#F59E0B', // warning yellow
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#8B5CF6', // violet
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TaskCompleteCelebration - Celebrates task completion
 * 
 * @param {Object} props
 * @param {boolean} props.show - Whether to show celebration
 * @param {Object} props.task - Completed task
 * @param {number} props.xp - XP earned
 * @param {string} props.level - 'micro' | 'small' | 'medium' | 'large' | 'epic'
 * @param {Function} props.onComplete - Called when animation finishes
 * @param {Object} props.position - { x, y } position for the animation
 */
export function TaskCompleteCelebration({
  show = false,
  task,
  xp = 10,
  level = 'small',
  onComplete,
  position = { x: '50%', y: '50%' },
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [confetti, setConfetti] = useState([]);
  
  const config = CELEBRATION_LEVELS[level] || CELEBRATION_LEVELS.small;
  
  // Generate confetti particles
  const generateConfetti = useCallback(() => {
    const particles = [];
    for (let i = 0; i < config.confettiCount; i++) {
      particles.push({
        id: i,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 6 + 4,
        angle: (360 / config.confettiCount) * i + Math.random() * 30,
        distance: Math.random() * 60 + 40,
        delay: Math.random() * 0.2,
      });
    }
    return particles;
  }, [config.confettiCount]);
  
  // Trigger animation when show changes
  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      setConfetti(generateConfetti());
      
      // Play sound if enabled
      if (config.playSound) {
        // TODO: Integrate with sound system
        // playTaskCompleteSound(level);
      }
      
      // End animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setConfetti([]);
        onComplete?.();
      }, config.duration + 500);
      
      return () => clearTimeout(timer);
    }
  }, [show, config, generateConfetti, onComplete]);
  
  if (!isAnimating) return null;
  
  return (
    <>
      {/* Screen flash for epic celebrations */}
      {config.screenFlash && (
        <div 
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
            animation: 'screen-flash 0.5s ease-out forwards',
          }}
        />
      )}
      
      {/* Main celebration container */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Check icon with scale animation */}
        <div
          className="relative flex items-center justify-center"
          style={{
            animation: `celebrate-pop ${config.duration}ms ease-out forwards`,
            '--scale': config.scale,
          }}
        >
          {/* Glow ring */}
          <div
            className="absolute w-16 h-16 rounded-full bg-success-500/20"
            style={{
              animation: 'glow-ring 0.6s ease-out forwards',
            }}
          />
          
          {/* Check icon */}
          <div className="relative w-12 h-12 rounded-full bg-success-500 flex items-center justify-center shadow-lg shadow-success-500/50">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          
          {/* Star burst for medium+ */}
          {config.showStar && (
            <Star
              className="absolute w-6 h-6 text-warning-500"
              style={{
                animation: 'star-burst 0.8s ease-out forwards',
                top: '-8px',
                right: '-8px',
              }}
            />
          )}
          
          {/* Confetti */}
          {confetti.map(particle => (
            <ConfettiParticle key={particle.id} {...particle} />
          ))}
          
          {/* XP float */}
          {config.showXP && xp > 0 && (
            <XPFloat xp={xp} delay={0.2} />
          )}
        </div>
      </div>
      
      {/* Keyframes */}
      <style>{`
        @keyframes celebrate-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(var(--scale, 1.1)); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes glow-ring {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes confetti-burst {
          0% { 
            transform: translate(0, 0) rotate(0deg); 
            opacity: 1; 
          }
          100% {
            transform:
              translate(
                calc(cos(var(--angle)) * var(--distance)),
                calc(sin(var(--angle)) * var(--distance) - 20px)
              ) 
              rotate(360deg); 
            opacity: 0; 
          }
        }
        
        @keyframes xp-float {
          0% { 
            transform: translateY(0); 
            opacity: 0; 
          }
          20% { 
            opacity: 1; 
          }
          100% {
            transform: translateY(-40px);
            opacity: 0;
          }
        }
        
        @keyframes star-burst {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.5) rotate(180deg); 
            opacity: 1; 
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes screen-flash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: Use Task Celebration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useTaskCelebration - Hook to trigger task completion celebrations
 */
export function useTaskCelebration() {
  const [celebration, setCelebration] = useState(null);
  
  const celebrate = useCallback((task, options = {}) => {
    const {
      xp = task?.xp || 10,
      level = determineLevel(task),
      position = { x: '50%', y: '50%' },
    } = options;
    
    setCelebration({
      id: Date.now(),
      task,
      xp,
      level,
      position,
    });
  }, []);
  
  const clearCelebration = useCallback(() => {
    setCelebration(null);
  }, []);
  
  return {
    celebration,
    celebrate,
    clearCelebration,
  };
}

// Determine celebration level based on task properties
function determineLevel(task) {
  if (!task) return 'small';
  
  const xp = task.xp || 0;
  const isBlocking = task.blocksCount > 0;
  const isCritical = task.priority === 'critical';
  const isUrgent = task.priority === 'urgent';
  
  if (xp >= 200 || (isBlocking && isCritical)) return 'epic';
  if (xp >= 100 || isBlocking) return 'large';
  if (xp >= 50 || isCritical || isUrgent) return 'medium';
  if (xp >= 20) return 'small';
  return 'micro';
}

export default TaskCompleteCelebration;
