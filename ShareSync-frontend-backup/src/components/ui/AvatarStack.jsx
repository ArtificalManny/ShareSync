// src/components/ui/AvatarStack.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 2.3: Overlapping Avatar Stack with Online Indicators
// PRINCIPLE: "Warmth Over Precision"
// Uses a curated, warm color palette for fallback initials to ensure the 
// interface feels human and intentionally designed.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';

const SIZE_CONFIG = {
  sm: {
    avatar: 'w-6 h-6',
    text: 'text-[9px]',
    dot: 'w-1.5 h-1.5',
    overlap: '-ml-1.5',
    overflow: 'w-6 h-6',
    ring: 'ring-2',
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

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Curated Warmth Palette for Avatars
 * Avoids harsh primary colors in favor of "Gallery Walk" appropriate hues.
 */
function getAvatarColor(str) {
  const colors = [
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-fuchsia-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  if (!str) return colors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

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
        flex-shrink-0 shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-default
      `}
      title={member.name || 'Team member'}
    >
      {hasImage ? (
        <img
          src={member.avatar}
          alt={member.name || 'Avatar'}
          className={`${config.avatar} rounded-full object-cover bg-white dark:bg-[#1f1f23]`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
          }}
        />
      ) : null}

      <div
        className={`
          ${hasImage ? 'hidden' : 'flex'}
          items-center justify-center
          ${config.avatar} rounded-full
          ${colorClass} text-white ${config.text} font-black tracking-tighter
        `}
      >
        {initials}
      </div>

      {showOnline && member.isOnline && (
        <span
          className={`
            absolute -bottom-0.5 -right-0.5
            ${config.dot} rounded-full
            bg-emerald-500
            ring-2 ring-white dark:ring-[#1f1f23]
          `}
        />
      )}
    </div>
  );
}

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

      {overflow > 0 && (
        <div
          className={`
            inline-flex items-center justify-center
            ${config.overflow} rounded-full
            ${config.overlap}
            ${config.ring} ring-white dark:ring-[#1f1f23]
            bg-slate-100 dark:bg-zinc-800
            ${config.text} font-black text-slate-600 dark:text-zinc-300
            flex-shrink-0 shadow-sm hover:scale-110 hover:z-10 transition-transform cursor-default
          `}
          title={`${overflow} more member${overflow !== 1 ? 's' : ''}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export function OnlineCount({ members = [], className = '' }) {
  const onlineCount = members.filter((m) => m.isOnline).length;
  if (onlineCount === 0) return null;

  return (
    <span className={`text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest ${className}`}>
      +{onlineCount} online
    </span>
  );
}
