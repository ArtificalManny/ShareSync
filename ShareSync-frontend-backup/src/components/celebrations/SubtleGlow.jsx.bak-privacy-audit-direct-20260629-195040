// src/components/celebrations/SubtleGlow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Creator-mode glow effect + inspirational quote overlay
// Subtle, non-intrusive — a warm glow around the edges + optional quote
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { getRandomQuote } from '../../data/inspirationalQuotes';

export default function SubtleGlow({
  show = false,
  duration = 2000,
  showQuote = true,
  eventType = 'taskComplete',
  data = {},
  onComplete,
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      setExiting(false);
      return;
    }

    // Pick a random quote
    if (showQuote) {
      setQuote(getRandomQuote());
    }

    setVisible(true);
    setExiting(false);

    // Start exit animation
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 400);

    // Fully hide
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [show, duration, showQuote, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9998]"
      aria-hidden="true"
    >
      {/* Edge glow */}
      <div
        className={`
          absolute inset-0 transition-opacity
          ${exiting ? 'opacity-0' : 'opacity-100'}
        `}
        style={{
          transitionDuration: '400ms',
          background: `
            radial-gradient(ellipse at top, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
          `,
        }}
      />

      {/* Subtle border glow */}
      <div
        className={`
          absolute inset-0 transition-opacity
          ${exiting ? 'opacity-0' : 'opacity-100'}
        `}
        style={{
          transitionDuration: '400ms',
          boxShadow: 'inset 0 0 80px rgba(168, 85, 247, 0.1)',
          borderRadius: '0',
        }}
      />

      {/* Quote overlay */}
      {showQuote && quote && (
        <div
          className={`
            absolute bottom-20 left-1/2 -translate-x-1/2
            max-w-md px-6 py-4 rounded-2xl
            bg-white/90 dark:bg-zinc-900/90
            backdrop-blur-sm
            border border-purple-100 dark:border-purple-500/20
            shadow-xl shadow-purple-500/10
            transition-all
            ${exiting
              ? 'opacity-0 translate-y-4'
              : 'opacity-100 translate-y-0'
            }
          `}
          style={{
            transitionDuration: '400ms',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <p className="text-sm text-slate-700 dark:text-zinc-200 italic text-center leading-relaxed">
            "{quote.text}"
          </p>
          {quote.author && (
            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center mt-2">
              — {quote.author}
            </p>
          )}
        </div>
      )}

      {/* Small sparkle dots */}
      <div
        className={`
          absolute top-1/4 left-1/2 -translate-x-1/2
          transition-opacity
          ${exiting ? 'opacity-0' : 'opacity-100'}
        `}
        style={{ transitionDuration: '300ms' }}
      >
        <span
          className="inline-block text-2xl"
          style={{
            animation: 'subtle-sparkle 1.5s ease-in-out infinite',
          }}
        >
          ✨
        </span>
      </div>

      <style>{`
        @keyframes subtle-sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
