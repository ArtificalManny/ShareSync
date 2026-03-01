// src/components/pulse/PulseCheckPrompt.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Gentle banner — "Take 30 seconds for your daily pulse"
// ═══════════════════════════════════════════════════════════════════════════════
//
// Appears at top of Home page when pulse is needed.
// Has dismiss (today) and snooze (30 min) options.
// Opens PulseCheckModal on click.
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Clock, ChevronRight } from 'lucide-react';
import PulseCheckModal from './PulseCheckModal';
import { usePulseCheck } from '../../hooks/usePulseCheck';

export default function PulseCheckPrompt({
  suggestedTask = null,
  className = '',
}) {
  const {
    shouldShowPrompt,
    submittedToday,
    isSubmitting,
    showModal,
    setShowModal,
    submit,
    snooze,
    dismiss,
    XP_REWARD,
  } = usePulseCheck();

  // Don't render if not needed
  if (!shouldShowPrompt && !showModal) return null;

  // If already submitted, show success briefly
  if (submittedToday && !showModal) return null;

  return (
    <>
      {/* Banner */}
      <AnimatePresence>
        {shouldShowPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className={className}
          >
            <div
              className="
                flex items-center justify-between gap-4 p-4 rounded-xl
                bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-500/5 dark:to-blue-500/5
                border border-violet-200 dark:border-violet-500/20
              "
            >
              {/* Left: icon + text */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                    Take 30 seconds for your daily pulse
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Quick energy check + focus pick → +{XP_REWARD} XP
                  </p>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Snooze */}
                <button
                  onClick={() => snooze(30)}
                  title="Remind me in 30 min"
                  className="p-2 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-white dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                </button>

                {/* Dismiss */}
                <button
                  onClick={dismiss}
                  title="Dismiss for today"
                  className="p-2 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-white dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Open modal */}
                <button
                  onClick={() => setShowModal(true)}
                  className="
                    flex items-center gap-1.5 px-4 py-2 rounded-lg
                    text-white text-xs font-semibold
                    shadow-sm hover:shadow-md transition-all
                  "
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
                >
                  Start
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <PulseCheckModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={submit}
            isSubmitting={isSubmitting}
            xpReward={XP_REWARD}
            suggestedTask={suggestedTask}
          />
        )}
      </AnimatePresence>
    </>
  );
}
