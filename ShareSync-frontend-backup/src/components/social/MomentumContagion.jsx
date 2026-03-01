// src/components/social/MomentumContagion.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.2: Momentum Contagion — Social Proof Engine
// ═══════════════════════════════════════════════════════════════════════════════
//
// The live "3 people shipping right now" banner with real names,
// task names, timestamps, and "You're next" CTA.
//
// USAGE:
//   <MomentumContagion activities={activitiesFromRealtime} className="mb-6" />
//
// Accepts activities from useHomeRealtime (or any source).
// Uses useMomentumContagion hook internally.
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Radio, Zap } from 'lucide-react';

import { useMomentumContagion } from '../../hooks/useMomentumContagion';
import ContagionFeedItem, { YoureNextCTA } from './ContagionFeedItem';
import ContagionOptIn from './ContagionOptIn';

// Safe momentum context import
let useMomentumContext;
try {
  const mod = require('../../contexts/MomentumContext');
  useMomentumContext = mod.useMomentumContext;
} catch {
  useMomentumContext = () => ({ glowLevel: 2, isFireMode: false });
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function MomentumContagion({
  activities = [],
  maxVisible = 3,
  showCTA = true,
  showOptIn = false,
  onPickMove,
  variant = 'default', // 'default' | 'compact' | 'sidebar'
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  let momentumCtx = { glowLevel: 2, isFireMode: false };
  try { momentumCtx = useMomentumContext(); } catch {}
  const { isFireMode } = momentumCtx;

  const { feed, stats, optedIn, setOptedIn } = useMomentumContagion({
    injectedActivities: activities,
    enabled: true,
  });

  // Items to display
  const visibleItems = useMemo(() => {
    if (isExpanded) return feed;
    return feed.slice(0, maxVisible);
  }, [feed, isExpanded, maxVisible]);

  const hasMore = feed.length > maxVisible;

  // If nothing to show and user is opted in, show minimal state
  if (stats.isEmpty && optedIn) {
    return (
      <div
        className={`
          flex items-center gap-3 p-4 rounded-xl
          bg-slate-50 dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06]
          ${className}
        `}
      >
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
          <Radio className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            No teammates shipping right now
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            Be the first to start — your team will see your momentum
          </p>
        </div>
      </div>
    );
  }

  // If user has opted out, show the opt-in card
  if (!optedIn) {
    if (showOptIn) {
      return <ContagionOptIn optedIn={false} onToggle={setOptedIn} variant="card" className={className} />;
    }
    return null;
  }

  // ── Sidebar variant (compact list) ──
  if (variant === 'sidebar') {
    return (
      <div className={`space-y-0.5 ${className}`}>
        {visibleItems.map((item) => (
          <ContagionFeedItem
            key={item.id}
            item={item}
            variant="compact"
          />
        ))}
        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-[10px] text-slate-400 dark:text-zinc-500 hover:text-violet-500 py-1 transition-colors"
          >
            +{feed.length - maxVisible} more
          </button>
        )}
      </div>
    );
  }

  // ── Compact variant (single-line summary + expandable) ──
  if (variant === 'compact') {
    return (
      <div className={className}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full flex items-center justify-between p-3 rounded-xl
            bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06]
            hover:border-violet-200 dark:hover:border-violet-500/20
            transition-colors
          `}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            <span className="text-sm text-slate-700 dark:text-zinc-300">
              <span className={`font-semibold ${isFireMode ? 'text-orange-500' : 'text-violet-600 dark:text-violet-400'}`}>
                {stats.uniqueActiveUsers}
              </span>
              {' '}shipping right now
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-2">
                {visibleItems.map((item) => (
                  <ContagionFeedItem key={item.id} item={item} />
                ))}
                {showCTA && <YoureNextCTA onClick={onPickMove} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Default variant (full banner with feed) ──
  return (
    <div
      className={`
        rounded-xl border overflow-hidden
        ${stats.shippingNow >= 3
          ? 'bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-500/5 dark:to-blue-500/5 border-violet-200 dark:border-violet-500/20'
          : 'bg-white dark:bg-[#1f1f23] border-slate-200 dark:border-white/[0.06]'
        }
        ${isFireMode ? 'border-orange-200 dark:border-orange-500/20' : ''}
        ${className}
      `}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {/* Live pulse */}
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFireMode ? 'bg-orange-500' : 'bg-violet-500'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isFireMode ? 'bg-orange-500' : 'bg-violet-500'}`} />
          </span>

          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            LIVE
          </span>

          <span className="text-sm text-slate-700 dark:text-zinc-300">
            <span className={`font-bold text-lg ${isFireMode ? 'text-orange-500' : 'text-violet-600 dark:text-violet-400'}`}>
              {stats.uniqueActiveUsers}
            </span>
            {' '}
            {stats.uniqueActiveUsers === 1 ? 'person' : 'people'} shipping right now
          </span>

          {stats.shippingNow >= 3 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
              🔥 High Activity
            </span>
          )}
        </div>

        {/* Expand/collapse */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 dark:text-zinc-500 hover:text-violet-500 transition-colors flex items-center gap-1"
          >
            {isExpanded ? 'Less' : `+${feed.length - maxVisible} more`}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Feed items */}
      <div className="p-3 space-y-2">
        <AnimatePresence initial={false}>
          {visibleItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <ContagionFeedItem item={item} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* You're next CTA */}
        {showCTA && (
          <YoureNextCTA onClick={onPickMove} />
        )}
      </div>

      {/* Opt-in toggle (if requested) */}
      {showOptIn && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06]">
          <ContagionOptIn optedIn={optedIn} onToggle={setOptedIn} variant="compact" />
        </div>
      )}
    </div>
  );
}
