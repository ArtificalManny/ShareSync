// src/components/onboarding/NamePersonalization.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9.2: Instant Gratification - Name Personalization
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows the user's name prominently throughout the app.
// Goal: User sees their name within 60 seconds, feels ownership.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Sparkles, User } from 'lucide-react';

/**
 * NameBanner - Prominent welcome banner with user's name
 * 
 * @param {string} name - User's first name
 * @param {string} archetype - User's selected archetype (optional)
 * @param {number} streak - Current streak (optional)
 * @param {function} onClose - Callback to dismiss (optional)
 */
export default function NameBanner({ 
  name, 
  archetype,
  streak = 0,
  onClose,
}) {
  const greetings = [
    `Welcome aboard, ${name}`,
    `Good to see you, ${name}`,
    `Ready to ship, ${name}?`,
    `Let's build, ${name}`,
  ];
  
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  return (
    <div className="relative p-6 rounded-2xl bg-gradient-to-r from-brand/10 via-accent-500/10 to-brand/10 border border-brand/20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-500/5 rounded-full blur-2xl" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar with initial */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand to-accent-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand/25">
            {name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {greeting}
            </h2>
            <p className="text-sm text-text-secondary">
              {archetype ? (
                <>You're a <span className="text-brand font-medium">{archetype}</span>. Let's ship.</>
              ) : (
                "Your journey starts now."
              )}
            </p>
          </div>
        </div>
        
        {/* Streak indicator */}
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/10 text-warning">
            <span className="text-lg">🔥</span>
            <span className="font-semibold">{streak}d streak</span>
          </div>
        )}
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * NameGreeting - Simple inline greeting
 */
export function NameGreeting({ name, className = '' }) {
  const hour = new Date().getHours();
  let timeGreeting = 'Hello';
  
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';
  
  return (
    <h1 className={`text-2xl font-semibold text-text-primary ${className}`}>
      {timeGreeting}, <span className="text-brand">{name || 'there'}</span>
    </h1>
  );
}

/**
 * NameAvatar - Circular avatar with name initial
 */
export function NameAvatar({ 
  name, 
  size = 'md',
  showName = false,
  status,
}) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  };
  
  const statusColors = {
    online: 'bg-success',
    away: 'bg-warning',
    busy: 'bg-error',
    offline: 'bg-text-tertiary',
  };
  
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`
          ${sizes[size]} rounded-xl
          bg-gradient-to-br from-brand to-accent-500
          flex items-center justify-center
          text-white font-bold
          shadow-lg shadow-brand/20
        `}>
          {initial}
        </div>
        
        {/* Status indicator */}
        {status && (
          <div className={`
            absolute -bottom-0.5 -right-0.5
            w-3 h-3 rounded-full border-2 border-surface-0
            ${statusColors[status]}
          `} />
        )}
      </div>
      
      {showName && (
        <span className="font-medium text-text-primary">{name}</span>
      )}
    </div>
  );
}

/**
 * FirstTimeUserCard - Card shown to brand new users
 */
export function FirstTimeUserCard({ name, archetype, onGetStarted }) {
  return (
    <div className="p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-brand" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            Welcome to ShareSync, {name}!
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {archetype ? (
              <>As a <span className="text-brand font-medium">{archetype}</span>, you'll thrive here. Let's set up your first project.</>
            ) : (
              "You're about to transform how you work. Let's get you started."
            )}
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Create First Task
            </button>
            <span className="text-xs text-text-tertiary">Takes 30 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * UserIdentityCard - Shows user's archetype and stats
 */
export function UserIdentityCard({ 
  name, 
  archetype,
  archetypeEmoji,
  level = 1,
  xp = 0,
  maxXp = 100,
}) {
  const progress = Math.min(100, (xp / maxXp) * 100);
  
  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-4 mb-4">
        <NameAvatar name={name} size="lg" status="online" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
          {archetype && (
            <p className="text-sm text-text-secondary flex items-center gap-1.5">
              <span>{archetypeEmoji || '🎯'}</span>
              {archetype}
            </p>
          )}
        </div>
      </div>
      
      {/* XP Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-tertiary">Level {level}</span>
          <span className="text-brand font-medium">{xp}/{maxXp} XP</span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <p className="text-[10px] text-text-tertiary text-center">
        Ship tasks to earn XP and level up
      </p>
    </div>
  );
}
