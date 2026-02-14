// src/components/messages/TypingIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// TYPING INDICATOR
// Shows who is currently typing in a conversation
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';

/**
 * Animated dots for typing indicator
 */
const TypingDots = ({ className = '' }) => (
  <div className={`flex gap-1 ${className}`}>
    <span 
      className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" 
      style={{ animationDelay: '0ms', animationDuration: '600ms' }} 
    />
    <span 
      className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" 
      style={{ animationDelay: '150ms', animationDuration: '600ms' }} 
    />
    <span 
      className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" 
      style={{ animationDelay: '300ms', animationDuration: '600ms' }} 
    />
  </div>
);

/**
 * Main typing indicator component
 * @param {string[]} users - Array of usernames who are typing
 * @param {string} className - Additional CSS classes
 */
export default function TypingIndicator({ users = [], className = '' }) {
  if (!users || users.length === 0) return null;
  
  // Generate text based on number of users typing
  const getText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    }
    if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    }
    if (users.length === 3) {
      return `${users[0]}, ${users[1]}, and ${users[2]} are typing`;
    }
    return `${users[0]} and ${users.length - 1} others are typing`;
  };
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 ${className}`}>
      <TypingDots />
      <span className="text-xs text-text-tertiary">{getText()}</span>
    </div>
  );
}

/**
 * Compact typing indicator (just dots, no text)
 */
export function TypingIndicatorCompact({ isTyping, className = '' }) {
  if (!isTyping) return null;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-surface-2 rounded-full ${className}`}>
      <TypingDots />
    </div>
  );
}

/**
 * Typing indicator inside a message bubble style
 */
export function TypingBubble({ user, className = '' }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-brand-400">
          {user?.[0]?.toUpperCase() || '?'}
        </span>
      </div>
      
      {/* Typing bubble */}
      <div className="bg-surface-2 rounded-2xl rounded-bl-md px-4 py-3">
        <TypingDots />
      </div>
    </div>
  );
}
