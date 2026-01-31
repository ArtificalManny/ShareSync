// src/components/behavioral/SocialThreads.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral: Visual Lines to Blocked Teammates
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { AlertCircle, ArrowRight, User, Clock } from 'lucide-react';

/**
 * Shows who is blocked by your tasks
 */
export default function SocialThreads({
  blockedUsers = [],
  blockingTask,
  onUnblock,
  className = '',
}) {
  if (blockedUsers.length === 0) return null;

  return (
    <div className={`
      p-4 rounded-xl
      bg-warning/5 border border-warning/20
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-warning" />
        <span className="text-sm font-medium text-warning">
          {blockedUsers.length} teammate{blockedUsers.length > 1 ? 's' : ''} waiting on you
        </span>
      </div>

      {/* Blocked Users */}
      <div className="space-y-2">
        {blockedUsers.map((user, index) => (
          <div
            key={user.id || index}
            className="flex items-center gap-3 p-2 rounded-lg bg-surface-2/30"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-surface-2 overflow-hidden shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-text-tertiary" />
                </div>
              )}
            </div>

            {/* Connection Line */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-warning/50" />
              <ArrowRight className="w-3 h-3 text-warning" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.name}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                Waiting on: {user.waitingFor || blockingTask?.title}
              </p>
            </div>

            {/* Wait Time */}
            {user.waitingSince && (
              <div className="flex items-center gap-1 text-xs text-text-tertiary shrink-0">
                <Clock className="w-3 h-3" />
                {formatWaitTime(user.waitingSince)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Unblock Action */}
      {onUnblock && (
        <button
          onClick={onUnblock}
          className="
            w-full mt-3 py-2 rounded-lg
            bg-warning/10 text-warning text-sm font-medium
            hover:bg-warning/20 transition-colors
          "
        >
          Complete task to unblock
        </button>
      )}
    </div>
  );
}

/**
 * Compact badge showing blocked count
 */
export function BlockedCountBadge({ count, onClick }) {
  if (!count || count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
        bg-warning/10 text-warning text-xs font-medium
        hover:bg-warning/20 transition-colors
      "
    >
      <AlertCircle className="w-3.5 h-3.5" />
      <span>Unblocks {count}</span>
    </button>
  );
}

function formatWaitTime(since) {
  const now = new Date();
  const start = new Date(since);
  const diffMs = now - start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  return '<1h';
}
