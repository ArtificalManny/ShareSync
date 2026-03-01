// src/components/ui/AvatarStack.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 2.3: Overlapping Avatar Stack with Online Indicators
// ═══════════════════════════════════════════════════════════════════════════════
//
// Displays overlapping circular avatars with optional online status dots.
// Used in ProjectCardV2, but reusable anywhere.
//
// Props:
//   members    — Array of { id, name, avatar?, isOnline? }
//   max        — Max avatars to show before "+N" overflow
//   size       — 'sm' | 'md' | 'lg'
//   showOnline — Show green online dots
//   className  — Additional classes
//
// NO BACKEND DEPENDENCIES. Pure presentational component.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';

/**
 * Size configuration
 */
const SIZE_CONFIG = {
  sm: {
    avatar: 'w-6 h-6',
    text: 'text-[9px]',
    dot: 'w-1.5 h-1.5',
    overlap: '-ml-1.5',
    overflow: 'w-6 h-6',
    ring: 'ring-1',
  },
  md: {
    avatar: 'w-8 h-8',
    text: 'text-[10px]',
    dot: 'w-2 h-2',
    overlap: '-ml-2',
    overflow: 'w-8 h-8',
    ring: 'ring-2',
  },
  lg: {
    avatar: 'w-10 h-10',
    text: 'text-xs',
    dot: 'w-2.5 h-2.5',
    overlap: '-ml-2.5',
    overflow: 'w-10 h-10',
    ring: 'ring-2',
  },
};

/**
 * Generate initials from a name string
 */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a deterministic color from a string (id or name)
 */
function getAvatarColor(str) {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-fuchsia-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  if (!str) return colors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Single avatar circle
 */
function AvatarCircle({ member, config, showOnline, isFirst }) {
  const hasImage = member.avatar && typeof member.avatar === 'string';
  const colorClass = getAvatarColor(member.id || member.name);
  const initials = getInitials(member.name);

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        ${config.avatar} rounded-full
        ${config.ring} ring-white dark:ring-[#1f1f23]
        ${isFirst ? '' : config.overlap}
        flex-shrink-0
      `}
      title={member.name || 'Team member'}
    >
      {hasImage ? (
        <img
          src={member.avatar}
          alt={member.name || 'Avatar'}
          className={`${config.avatar} rounded-full object-cover`}
          onError={(e) => {
            // Fallback to initials on image load error
            e.target.style.display = 'none';
            e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
          }}
        />
      ) : null}

      {/* Initials fallback (shown if no image or image fails) */}
      <div
        className={`
          ${hasImage ? 'hidden' : 'flex'}
          items-center justify-center
          ${config.avatar} rounded-full
          ${colorClass} text-white ${config.text} font-medium
        `}
      >
        {initials}
      </div>

      {/* Online indicator dot */}
      {showOnline && member.isOnline && (
        <span
          className={`
            absolute -bottom-0.5 -right-0.5
            ${config.dot} rounded-full
            bg-emerald-500
            ring-1 ring-white dark:ring-[#1f1f23]
          `}
        />
      )}
    </div>
  );
}

/**
 * Main AvatarStack component
 */
export default function AvatarStack({
  members = [],
  max = 3,
  size = 'sm',
  showOnline = true,
  className = '',
}) {
  if (!members || members.length === 0) return null;

  const config = SIZE_CONFIG[size] || SIZE_CONFIG.sm;
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((member, index) => (
        <AvatarCircle
          key={member.id || member._id || index}
          member={member}
          config={config}
          showOnline={showOnline}
          isFirst={index === 0}
        />
      ))}

      {/* Overflow indicator */}
      {overflow > 0 && (
        <div
          className={`
            inline-flex items-center justify-center
            ${config.overflow} rounded-full
            ${config.overlap}
            ${config.ring} ring-white dark:ring-[#1f1f23]
            bg-slate-200 dark:bg-zinc-700
            ${config.text} font-medium text-slate-600 dark:text-zinc-300
            flex-shrink-0
          `}
          title={`${overflow} more member${overflow !== 1 ? 's' : ''}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/**
 * Inline helper: count of online members
 */
export function OnlineCount({ members = [], className = '' }) {
  const onlineCount = members.filter((m) => m.isOnline).length;
  if (onlineCount === 0) return null;

  return (
    <span className={`text-xs text-emerald-600 dark:text-emerald-400 font-medium ${className}`}>
      +{onlineCount} online
    </span>
  );
}
