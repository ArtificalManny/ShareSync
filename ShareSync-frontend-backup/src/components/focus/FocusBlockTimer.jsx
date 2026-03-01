// src/components/focus/FocusBlockTimer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.3: Top-Bar Focus Block Countdown Timer
// ═══════════════════════════════════════════════════════════════════════════════
//
// Subtle, persistent timer in the Navbar.
// Shows: remaining time, progress bar, task name, stop button.
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Plus, Target } from 'lucide-react';
import '../../styles/focus-block.css';

export default function FocusBlockTimer({
  isActive = false,
  formattedTime = '0:00',
  progress = 0,
  taskName = '',
  presetLabel = '',
  elapsedMinutes = 0,
  onStop,
  onExtend,
  className = '',
}) {
  const [showControls, setShowControls] = useState(false);

  // Color based on progress
  const barColor = useMemo(() => {
    if (progress > 0.9) return '#EF4444'; // Red — almost done
    if (progress > 0.75) return '#F97316'; // Orange — winding down
    return '#8B5CF6'; // Violet — normal
  }, [progress]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`focus-block-timer flex items-center gap-2 ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Timer badge */}
      <div
        className="
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-violet-50 dark:bg-violet-500/10
          border border-violet-200 dark:border-violet-500/20
          transition-all duration-300 relative overflow-hidden
        "
      >
        {/* Progress bar at bottom */}
        <div
          className="absolute bottom-0 left-0 h-[2px] transition-all duration-1000 ease-linear focus-timer-bar"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: barColor,
          }}
        />

        {/* Pulsing dot */}
        <div className="focus-block-pulse w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />

        {/* Timer */}
        <span className="text-xs font-bold text-violet-700 dark:text-violet-300 tabular-nums min-w-[40px]">
          {formattedTime}
        </span>

        {/* Task name (truncated) */}
        {taskName && (
          <>
            <div className="w-px h-3 bg-violet-200 dark:bg-violet-500/30" />
            <span className="text-[10px] text-violet-500 dark:text-violet-400 truncate max-w-[120px]">
              {taskName}
            </span>
          </>
        )}

        {/* XP badge */}
        <span className="text-[9px] font-bold text-violet-400 dark:text-violet-500 px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-500/10">
          2x XP
        </span>

        {/* Controls on hover */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 ml-1 overflow-hidden"
            >
              {/* Extend */}
              <button
                onClick={(e) => { e.stopPropagation(); onExtend?.(); }}
                title="Extend +15 min"
                className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
              >
                <Plus className="w-3 h-3 text-violet-500" />
              </button>

              {/* Stop */}
              <button
                onClick={(e) => { e.stopPropagation(); onStop?.(); }}
                title="End focus block"
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
