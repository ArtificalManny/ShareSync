// src/components/focus/FocusComplete.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Completion Celebration
// ═══════════════════════════════════════════════════════════════════════════════
//
// Celebrates when a focus session is completed.
// Shows stats, encourages break, offers to start another.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Coffee, 
  Zap, 
  TrendingUp, 
  Clock, 
  Target,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import useFocusSession, { useFocusStats } from '../../hooks/useFocusSession';

/**
 * FocusComplete - Full celebration modal
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {number} duration - Session duration in minutes
 * @param {string} taskName - What was focused on
 * @param {function} onClose - Close callback
 * @param {function} onStartBreak - Start break callback
 * @param {function} onStartAnother - Start another session callback
 */
export default function FocusComplete({
  show,
  duration = 25,
  taskName,
  onClose,
  onStartBreak,
  onStartAnother,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { today, weekly } = useFocusStats();

  // Animate in
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setShowConfetti(true);
      
      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  // Calculate encouragement message based on stats
  const getEncouragement = () => {
    if (today.sessions >= 4) return "You're on fire today! 🔥";
    if (today.sessions >= 2) return "Great momentum building!";
    if (weekly.sessions >= 10) return "Consistent week! Keep it up!";
    return "Excellent focus! You earned this.";
  };

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center p-4
      transition-all duration-300
      ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}
    `}>
      {/* Confetti */}
      {showConfetti && <ConfettiEffect />}

      {/* Modal */}
      <div className={`
        relative w-full max-w-md p-8 rounded-2xl
        bg-surface-1 border border-success/20
        shadow-2xl shadow-success/10
        text-center
        transition-all duration-500
        ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
      `}>
        {/* Success icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-success/20 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-success to-success-600 flex items-center justify-center shadow-lg">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Focus Session Complete! 🎉
        </h2>
        
        <p className="text-text-secondary mb-6">
          {getEncouragement()}
        </p>

        {/* Session stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox 
            icon={Clock}
            value={`${duration}m`}
            label="Focused"
          />
          <StatBox 
            icon={Flame}
            value={today.sessions}
            label="Today"
            highlight
          />
          <StatBox 
            icon={TrendingUp}
            value={weekly.sessions}
            label="This Week"
          />
        </div>

        {/* Task completed */}
        {taskName && (
          <div className="p-4 rounded-xl bg-surface-2 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Target className="w-4 h-4 text-success" />
              <span className="text-text-secondary">Focused on:</span>
              <span className="font-medium text-text-primary">{taskName}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Take a break */}
          <button
            onClick={onStartBreak}
            className="
              w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-success text-white font-semibold
              hover:bg-success-600
              transition-colors
            "
          >
            <Coffee className="w-5 h-5" />
            Take a 5-minute Break
          </button>

          {/* Start another */}
          <button
            onClick={onStartAnother}
            className="
              w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-surface-2 text-text-primary font-medium
              hover:bg-surface-3
              transition-colors
            "
          >
            <Zap className="w-5 h-5 text-brand" />
            Start Another Session
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="
              w-full py-2 text-sm text-text-tertiary
              hover:text-text-secondary
              transition-colors
            "
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Box component
 */
function StatBox({ icon: Icon, value, label, highlight = false }) {
  return (
    <div className={`
      p-3 rounded-xl
      ${highlight ? 'bg-success/10 border border-success/20' : 'bg-surface-2'}
    `}>
      <Icon className={`w-5 h-5 mx-auto mb-1 ${highlight ? 'text-success' : 'text-text-tertiary'}`} />
      <div className={`text-xl font-bold ${highlight ? 'text-success' : 'text-text-primary'}`}>
        {value}
      </div>
      <div className="text-xs text-text-tertiary">{label}</div>
    </div>
  );
}

/**
 * Confetti Effect
 */
function ConfettiEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            '--x': `${Math.random() * 100}%`,
            '--delay': `${Math.random() * 0.5}s`,
            '--rotation': `${Math.random() * 360}deg`,
            '--color': ['#10B981', '#A855F7', '#F59E0B', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 5)],
          }}
        />
      ))}
      
      <style>{`
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--color);
          left: var(--x);
          top: -10px;
          border-radius: 2px;
          animation: confetti-fall 3s ease-out var(--delay) forwards;
          transform: rotate(var(--rotation));
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          Available {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * FocusCompleteToast - Smaller notification version
 */
export function FocusCompleteToast({ show, duration, onClose, onStartBreak }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-close after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div className={`
      fixed bottom-6 right-6 z-50
      w-80 p-4 rounded-xl
      bg-surface-1 border border-success/20
      shadow-2xl
      transition-all duration-300
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-success" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-text-primary">
            Focus Complete! 🎉
          </h4>
          <p className="text-sm text-text-secondary">
            {duration} minutes of focused work. Great job!
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onStartBreak}
          className="
            flex-1 py-2 rounded-lg
            bg-success/10 text-success text-sm font-medium
            hover:bg-success/20
            transition-colors
          "
        >
          <Coffee className="w-4 h-4 inline mr-1" />
          Take Break
        </button>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="
            px-3 py-2 rounded-lg
            text-text-tertiary text-sm
            hover:bg-surface-2
            transition-colors
          "
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/**
 * BreakTimer - Shows during break
 */
export function BreakTimer({ remainingSeconds, onSkip, onExtend }) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="
      fixed bottom-6 right-6 z-50
      p-6 rounded-2xl
      bg-gradient-to-br from-success/20 to-brand/20
      border border-success/30
      shadow-xl
      text-center
    ">
      <Coffee className="w-8 h-8 text-success mx-auto mb-2" />
      <h4 className="text-sm font-medium text-text-secondary mb-1">Break Time</h4>
      <span className="text-3xl font-bold text-text-primary tabular-nums">
        {formatted}
      </span>
      
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={onExtend}
          className="
            px-3 py-1.5 rounded-lg text-sm
            bg-surface-2 text-text-secondary
            hover:bg-surface-3
            transition-colors
          "
        >
          +5 min
        </button>
        <button
          onClick={onSkip}
          className="
            px-3 py-1.5 rounded-lg text-sm
            bg-brand text-white
            hover:bg-brand-600
            transition-colors
          "
        >
          Back to work
        </button>
      </div>
    </div>
  );
}

/**
 * SessionMilestone - Celebrates session milestones
 */
export function SessionMilestone({ sessionsToday, onDismiss }) {
  const milestones = {
    3: { emoji: '⚡', message: '3 sessions today! You\'re locked in.' },
    5: { emoji: '🔥', message: '5 sessions! Serious focus mode.' },
    8: { emoji: '💪', message: '8 sessions! You\'re unstoppable!' },
    10: { emoji: '🏆', message: '10 sessions! Focus champion!' },
  };

  const milestone = milestones[sessionsToday];
  if (!milestone) return null;

  return (
    <div className="
      fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/50 backdrop-blur-sm
    ">
      <div className="
        p-8 rounded-2xl
        bg-surface-1 border border-warning/20
        text-center max-w-sm
        animate-bounce-subtle
      ">
        <div className="text-6xl mb-4">{milestone.emoji}</div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Focus Milestone!
        </h3>
        <p className="text-text-secondary mb-6">{milestone.message}</p>
        <button
          onClick={onDismiss}
          className="
            px-6 py-2.5 rounded-xl
            bg-warning text-white font-semibold
            hover:bg-warning-600
            transition-colors
          "
        >
          Keep Going!
        </button>
      </div>
    </div>
  );
}
