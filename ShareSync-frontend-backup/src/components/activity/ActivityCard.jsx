// src/components/activity/ActivityCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ ZONE 1: Identity      │ ZONE 2: Status              │ ZONE 3: Action        │
// │ ──────────────────    │ ──────────────────          │ ──────────────────    │
// │ Avatar + User + Action│ Description (what happened) │ Time + Earned badges  │
// └─────────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Flame, ChevronRight } from 'lucide-react';

export default function ActivityCard({ user, action, description, timestamp, streakDays, xp, tier, onClick }) {
  const formatTimeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Only show streak if impressive (7+ days)
  const showStreak = streakDays >= 7;

  return (
    <div 
      onClick={onClick}
      className={`
        group flex items-center gap-4 p-3 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: Identity (Who did what?)
          Avatar + User name + Action verb
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar */}
        <img 
          src={user?.avatar || '/default-avatar.png'} 
          alt={user?.name || 'User'} 
          className="w-9 h-9 rounded-full bg-surface-2 shrink-0 object-cover"
        />
        
        {/* User + Action + Description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-text-primary">
              {user?.name}
            </span>
            <span className="text-sm text-text-tertiary">
              {action}
            </span>
          </div>
          
          {/* Description (truncated) */}
          {description && (
            <p className="text-xs text-text-secondary mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: Status (When? + Earned rewards)
          Timestamp + XP/Streak badges (if earned)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {/* Earned badges - compact, only if meaningful */}
        {showStreak && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-warning">
            <Flame className="w-3 h-3" />
            {streakDays}d
          </span>
        )}
        
        {xp > 0 && (
          <span className="text-[10px] font-medium text-brand">
            +{xp} XP
          </span>
        )}
        
        {tier && (
          <span className="text-[10px] font-medium text-text-tertiary">
            {tier}
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: Action (Time + Navigate)
          Timestamp + Chevron
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-text-tertiary">
          {formatTimeAgo(timestamp)}
        </span>

        {onClick && (
          <ChevronRight className="
            w-4 h-4 text-text-tertiary
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          " />
        )}
      </div>
    </div>
  );
}
