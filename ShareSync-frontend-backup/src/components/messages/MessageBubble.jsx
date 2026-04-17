// src/components/messages/MessageBubble.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC MESSAGE BUBBLE v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Communication Hub"
//
// COLOR MAP:
// - Message Bubble (Sent): #8B5CF6 (violet-500) with white text
// - Message Bubble (Received): #F1F5F9 (slate-100) with slate-800 text
// - Timestamp: #94A3B8 (slate-400)
// - Avatar Background: #EDE9FE (violet-100)
// - Avatar Text: #7C3AED (violet-600)
//
// NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { getUserInitials } from '../../api/messages';

const cn = (...classes) => classes.filter(Boolean).join(' ');

/* ─────────────────────────────────────────────────────────────────────────
   AVATAR - Light theme with violet accent
───────────────────────────────────────────────────────────────────────── */
const Avatar = ({ user, size = 'sm' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
  };

  const initials = getUserInitials(user);

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt=""
        className={cn(sizes[size], 'rounded-full object-cover')}
      />
    );
  }

  return (
    <div
      className={cn(
        sizes[size],
        'rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0'
      )}
    >
      <span className="font-medium text-violet-600">{initials}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MESSAGE BUBBLE - Light theme
───────────────────────────────────────────────────────────────────────── */
export default function MessageBubble({ message, isOwn, showAvatar, otherUser }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      {showAvatar && !isOwn ? <Avatar user={otherUser} /> : <div className="w-8" />}

      <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl',
            isOwn
              ? 'bg-violet-500 text-white rounded-br-md'
              : 'bg-slate-100 text-slate-800 rounded-bl-md',
            message.__optimistic && 'opacity-70'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        <div className={cn('flex items-center gap-2 mt-1', isOwn && 'justify-end')}>
          <span className="text-xs text-slate-400">{time}</span>

          {message.isEdited && (
            <span className="text-xs text-slate-400">(edited)</span>
          )}

          {message.__optimistic && (
            <span className="text-xs text-slate-400">Sending...</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SYSTEM MESSAGE - For events like "User joined", etc.
───────────────────────────────────────────────────────────────────────── */
export function SystemMessage({ content, timestamp }) {
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="flex justify-center py-2">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">
        <span>{content}</span>
        {time && <span className="text-slate-400">• {time}</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DATE SEPARATOR - For grouping messages by date
───────────────────────────────────────────────────────────────────────── */
export function DateSeparator({ date }) {
  const formatDate = (d) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">{formatDate(new Date(date))}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
