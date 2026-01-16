// src/components/activity/ActivityCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// 1) User (avatar + name)  2) Action + description  3) Timestamp + earned badges
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Card, { CardBadge } from '../common/Card';
import { Flame } from 'lucide-react';

export default function ActivityCard({ user, action, description, timestamp, streakDays, xp, tier }) {
  const formatTimeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Only show streak badge if impressive (7+ days)
  const showStreak = streakDays >= 7;

  return (
    <Card variant="ambient" padding="sm" className="group">
      {/* Header: User + Timestamp */}
      <div className="flex items-start gap-3">
        {/* Element 1: User Avatar */}
        <img 
          src={user?.avatar || '/default-avatar.png'} 
          alt={user?.name || 'User'} 
          className="w-9 h-9 rounded-full bg-surface-2 shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          {/* User + Action */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-text-primary">
              {user?.name}
            </span>
            <span className="text-sm text-text-tertiary">
              {action}
            </span>
          </div>
          
          {/* Element 2: Description */}
          {description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">
              {description}
            </p>
          )}
          
          {/* Element 3: Metadata Row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Timestamp */}
            <span className="text-xs text-text-tertiary">
              {formatTimeAgo(timestamp)}
            </span>
            
            {/* Earned badges - only show if meaningful */}
            {showStreak && (
              <CardBadge variant="warning">
                <Flame className="w-3 h-3 mr-1" />
                {streakDays}d
              </CardBadge>
            )}
            
            {xp > 0 && (
              <CardBadge variant="brand">+{xp} XP</CardBadge>
            )}
            
            {tier && (
              <CardBadge variant="default">{tier}</CardBadge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
