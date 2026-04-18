// src/components/social/MomentumContagion.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.2: Momentum Contagion — Social Proof Engine
// PRINCIPLE: "Warmth Over Precision"
// Uses the dynamic momentum variables (--theme-accent-primary) so the social 
// feed heats up visually along with the rest of the application.
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

export default function MomentumContagion({
  activities = [],
  maxVisible = 3,
  showCTA = true,
  showOptIn = false,
  onPickMove,
  variant = 'default',
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  let momentumCtx = { glowLevel: 2, isFireMode: false };
  try { momentumCtx = useMomentumContext(); } catch {}
  const { isFireMode } = momentumCtx;

  const { feed, stats, optedIn, setOptedIn } = useMomentumContagion({
    injectedActivities: activities,
    maxItems: maxVisible + 2,
    enabled: true,
  });

  const visibleItems = useMemo(() => {
    if (isExpanded) return feed;
    return feed.slice(0, maxVisible);
  }, [feed, isExpanded, maxVisible]);

  const hasMore = feed.length > maxVisible;

  if (stats.isEmpty && optedIn) {
    return (
      <div
        className={`
          flex items-center gap-3 p-4 rounded-xl
          bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm
          ${className}
        `}
      >
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm">
          <Radio className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">
            No teammates shipping right now
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Be the first to start — your team will see your momentum.
          </p>
        </div>
      </div>
    );
  }

  if (!optedIn) {
    if (showOptIn) {
      return <ContagionOptIn optedIn={false} onToggle={setOptedIn} variant="card" className={className} />;
    }
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <div className={`space-y-1 ${className}`}>
        {visibleItems.map((item) => (
          <ContagionFeedItem key={item.id} item={item} variant="compact" />
        ))}
        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 hover:text-[var(--theme-accent-primary)] py-2 transition-colors"
          >
            +{feed.length - maxVisible} more
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={className}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full flex items-center justify-between p-3.5 rounded-xl
            bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
            hover:border-[var(--theme-accent-primary)] hover:shadow-md
            transition-all duration-300
          `}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-accent-primary)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--theme-accent-primary)]" />
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              <span className="font-black text-[var(--theme-accent-primary)] text-base mr-1">
                {stats.uniqueActiveUsers}
              </span>
              shipping right now
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

  return (
    <div
      className={`
        rounded-xl border overflow-hidden transition-all duration-500 shadow-sm
        ${stats.shippingNow >= 3
          ? 'bg-[var(--theme-accent-glow)] border-[var(--theme-accent-primary)]/30'
          : 'bg-white dark:bg-[#1f1f23] border-slate-200 dark:border-white/10'
        }
        ${isFireMode ? 'border-orange-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[var(--theme-accent-primary)]" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--theme-accent-primary)]" />
          </span>

          <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
            LIVE
          </span>

          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
            <span className="font-black text-lg text-[var(--theme-accent-primary)] mr-1.5 transition-colors">
              {stats.uniqueActiveUsers}
            </span>
            {stats.uniqueActiveUsers === 1 ? 'person' : 'people'} shipping right now
          </span>

          {stats.shippingNow >= 3 && (
            <span className="px-2 py-1 rounded-md text-[10px] font-black bg-[var(--theme-accent-primary)] text-white ml-2 shadow-sm animate-pulse">
              🔥 High Activity
            </span>
          )}
        </div>

        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 hover:text-[var(--theme-accent-primary)] transition-colors flex items-center gap-1"
          >
            {isExpanded ? 'Less' : `+${feed.length - maxVisible} more`}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence initial={false}>
          {visibleItems.map((item, index) => (
            <motion.div
              layout // ⭐ STEP 3: The magic property for smooth list shifting
              key={item.id}
              initial={{ opacity: 0, scale: 0.95, y: -20, height: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.95, y: 20, height: 0 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <ContagionFeedItem item={item} />
            </motion.div>
          ))}
        </AnimatePresence>

        {showCTA && (
          <YoureNextCTA onClick={onPickMove} />
        )}
      </div>

      {showOptIn && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <ContagionOptIn optedIn={optedIn} onToggle={setOptedIn} variant="compact" />
        </div>
      )}
    </div>
  );
}
