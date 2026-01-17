// src/components/context/YouWereHere.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PRESERVATION - "You Were Here" Ghost Highlight
// ═══════════════════════════════════════════════════════════════════════════════
// Wraps any card/item to add a subtle pulsing highlight when the user returns
// to something they were working on. The highlight fades after a few seconds.
//
// Usage:
//   <YouWereHere itemId={task.id} isHighlighted={isHighlighted(task.id)}>
//     <TaskCard task={task} />
//   </YouWereHere>
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';

export default function YouWereHere({ 
  children, 
  itemId,
  isHighlighted = false,
  duration = 5000, // How long the highlight shows
  className = '',
}) {
  const [showHighlight, setShowHighlight] = useState(isHighlighted);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      setShowHighlight(true);
      setIsFading(false);
      
      // Start fading after most of the duration
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, duration - 1000);
      
      // Remove highlight after full duration
      const hideTimer = setTimeout(() => {
        setShowHighlight(false);
        setIsFading(false);
      }, duration);
      
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShowHighlight(false);
      setIsFading(false);
    }
  }, [isHighlighted, duration]);

  if (!showHighlight) {
    return <>{children}</>;
  }

  return (
    <div 
      className={`
        relative
        ${className}
      `}
      data-you-were-here={itemId}
    >
      {/* Ghost highlight border */}
      <div 
        className={`
          absolute inset-0 rounded-xl pointer-events-none
          border-2 border-brand/50
          transition-all duration-1000
          ${isFading ? 'opacity-0' : 'opacity-100'}
          ${!isFading ? 'animate-pulse' : ''}
        `}
        style={{
          boxShadow: isFading ? 'none' : '0 0 20px rgba(139, 92, 246, 0.15)',
        }}
      />
      
      {/* "You were here" label */}
      <div 
        className={`
          absolute -top-2 left-4 z-10
          px-2 py-0.5 rounded-full
          bg-brand text-white text-[10px] font-medium
          transition-all duration-500
          ${isFading ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}
        `}
      >
        You were here
      </div>
      
      {children}
    </div>
  );
}

/**
 * Simpler version - just adds a subtle left border accent
 */
export function YouWereHereAccent({ 
  children, 
  isHighlighted = false,
  className = '',
}) {
  return (
    <div 
      className={`
        transition-all duration-500
        ${isHighlighted 
          ? 'border-l-2 border-brand pl-2 bg-brand/5' 
          : 'border-l-2 border-transparent pl-2'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}
