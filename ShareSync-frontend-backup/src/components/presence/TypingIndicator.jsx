// src/components/presence/TypingIndicator.jsx - Week 8 Day 1-2
import React from 'react';

/**
 * TypingIndicator - Shows "User is typing..." animation
 * @param {string} userName - Name of user who is typing
 * @param {boolean} isTyping - Whether to show typing indicator
 */
const TypingIndicator = ({ userName = 'Someone', isTyping = false }) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400 italic">
      <span>{userName} is typing</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
