// src/components/onboarding/StreakIntro.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9.2: Instant Gratification - Streak System Introduction
// ═══════════════════════════════════════════════════════════════════════════════
//
// Explains the streak mechanic visually to new users.
// Goal: User understands they're building something valuable from day 1.
//
// Design: Not a boring tutorial. A promise of what they're building.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, TrendingUp, Zap, ChevronRight } from 'lucide-react';

/**
 * StreakIntro - Visual introduction to the streak system
 * 
 * @param {string} userName - User's first name
 * @param {function} onContinue - Callback when user acknowledges
 * @param {boolean} compact - Compact mode for inline use
 */
export default function StreakIntro({ 
  userName = '', 
  onContinue,
  compact = false,
}) {
  const [currentDay, setCurrentDay] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate the streak building up
  useEffect(() => {
    if (compact) return;
    
    const timer = setTimeout(() => {
      setIsAnimating(true);
      
      // Animate through days 0-7
      let day = 0;
      const interval = setInterval(() => {
        day++;
        setCurrentDay(day);
        if (day >= 7) {
          clearInterval(interval);
        }
      }, 200);
      
      return () => clearInterval(interval);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [compact]);

  if (compact) {
    return <StreakIntroCompact userName={userName} onContinue={onContinue} />;
  }

  return (
    <div className="p-8 rounded-2xl bg-surface-1 border border-white/[0.06] text-center">
      {/* Header */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-warning/25">
        <Flame className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Your streak starts now
      </h2>
      <p className="text-text-secondary mb-8 max-w-sm mx-auto">
        Ship at least one task every day. Watch your streak grow. 
        Consistency beats intensity.
      </p>
      
      {/* Streak visualization */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {[...Array(7)].map((_, i) => {
            const isActive = i < currentDay;
            const isToday = i === 0;
            
            return (
              <div
                key={i}
                className={`
                  relative w-10 h-10 rounded-lg flex items-center justify-center
                  transition-all duration-300
                  ${isActive 
                    ? 'bg-warning text-white scale-100' 
                    : 'bg-surface-2 text-text-tertiary scale-90'
                  }
                  ${isToday && isActive ? 'ring-2 ring-warning ring-offset-2 ring-offset-surface-1' : ''}
                `}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {isActive ? (
                  <Flame className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-medium">{i + 1}</span>
                )}
                
                {/* Day label */}
                <span className="absolute -bottom-5 text-[10px] text-text-tertiary">
                  {isToday ? 'Today' : `Day ${i + 1}`}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Current streak display */}
        <div className={`
          mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full
          transition-all duration-500
          ${currentDay > 0 
            ? 'bg-warning/10 text-warning' 
            : 'bg-surface-2 text-text-tertiary'
          }
        `}>
          <Flame className="w-4 h-4" />
          <span className="font-semibold tabular-nums">
            {currentDay} day streak
          </span>
        </div>
      </div>
      
      {/* Benefits */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <BenefitItem 
          icon={Calendar}
          title="Build habits"
          description="Daily shipping becomes automatic"
        />
        <BenefitItem 
          icon={TrendingUp}
          title="Gain momentum"
          description="Small wins compound over time"
        />
        <BenefitItem 
          icon={Zap}
          title="Stay motivated"
          description="Your streak becomes your fuel"
        />
      </div>
      
      {/* CTA */}
      <button
        onClick={onContinue}
        className="
          group inline-flex items-center gap-2 px-6 py-3 rounded-xl
          bg-brand text-white font-semibold
          hover:bg-brand-600 hover:shadow-glow-brand
          transition-all duration-300
        "
      >
        Start My Streak
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
      
      {/* Note */}
      <p className="mt-6 text-xs text-text-tertiary">
        Ship one task today to start your streak at 1 day
      </p>
    </div>
  );
}

/**
 * Benefit item for the grid
 */
function BenefitItem({ icon: Icon, title, description }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center mx-auto mb-2">
        <Icon className="w-5 h-5 text-text-tertiary" />
      </div>
      <h4 className="text-sm font-medium text-text-primary mb-0.5">{title}</h4>
      <p className="text-[10px] text-text-tertiary leading-tight">{description}</p>
    </div>
  );
}

/**
 * Compact version for dashboard/sidebar
 */
function StreakIntroCompact({ userName, onContinue }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-warning/10 to-orange-500/10 border border-warning/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
          <Flame className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-primary">
            Start your streak
          </h4>
          <p className="text-xs text-text-secondary">
            Ship daily, build momentum
          </p>
        </div>
      </div>
      
      {/* Mini streak preview */}
      <div className="flex items-center gap-1.5 mb-3">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`
              w-6 h-6 rounded flex items-center justify-center text-[10px]
              ${i === 0 
                ? 'bg-warning text-white font-bold' 
                : 'bg-surface-2 text-text-tertiary'
              }
            `}
          >
            {i === 0 ? '🔥' : i + 1}
          </div>
        ))}
      </div>
      
      <button
        onClick={onContinue}
        className="w-full py-2 rounded-lg bg-warning/20 text-warning text-sm font-medium hover:bg-warning/30 transition-colors"
      >
        Ship your first task →
      </button>
    </div>
  );
}

/**
 * Streak milestone celebration
 */
export function StreakMilestone({ days, onDismiss }) {
  const milestones = {
    3: { emoji: '🔥', message: 'Hot start!' },
    7: { emoji: '⚡', message: 'One week strong!' },
    14: { emoji: '💪', message: 'Two weeks of shipping!' },
    30: { emoji: '🏆', message: 'Monthly champion!' },
    100: { emoji: '🚀', message: 'Legendary shipper!' },
  };
  
  const milestone = milestones[days];
  if (!milestone) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="p-8 rounded-2xl bg-surface-1 border border-warning/20 text-center max-w-sm mx-4 animate-bounce-subtle">
        <div className="text-6xl mb-4">{milestone.emoji}</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {days} Day Streak!
        </h2>
        <p className="text-text-secondary mb-6">{milestone.message}</p>
        <button
          onClick={onDismiss}
          className="px-6 py-2.5 rounded-xl bg-warning text-white font-semibold hover:bg-warning-600 transition-colors"
        >
          Keep Going!
        </button>
      </div>
    </div>
  );
}
