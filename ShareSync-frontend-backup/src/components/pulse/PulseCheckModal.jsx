// src/components/pulse/PulseCheckModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Pulse Check Modal — 30-Second Daily Standup
// ═══════════════════════════════════════════════════════════════════════════════
//
// 3 steps in one compact modal:
//   1. Energy emoji picker (5 levels)
//   2. #1 focus task (auto-suggested or type)
//   3. Blocker yes/no with optional text
//   → Submit (+15 XP)
//
// ZERO BACKEND CHANGES (uses api/pulse.js which gracefully fails)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { ENERGY_LEVELS } from '../../hooks/usePulseCheck';

// ─────────────────────────────────────────────────────────────────────────
// ENERGY PICKER
// ─────────────────────────────────────────────────────────────────────────
const EnergyPicker = ({ selected, onSelect }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        How's your energy today?
      </p>
      <div className="flex items-center justify-between gap-2">
        {ENERGY_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onSelect(level.value)}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all flex-1
              ${selected === level.value
                ? `border-violet-500 ${level.bg} scale-105 shadow-md`
                : 'border-slate-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/30 bg-white dark:bg-[#1f1f23]'
              }
            `}
          >
            <span className="text-2xl">{level.emoji}</span>
            <span className={`text-[10px] font-medium ${
              selected === level.value ? 'text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-zinc-400'
            }`}>
              {level.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// FOCUS TASK INPUT
// ─────────────────────────────────────────────────────────────────────────
const FocusTaskInput = ({ value, onChange, suggestedTask }) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        What's your #1 focus today?
      </p>
      {suggestedTask && !value && (
        <button
          type="button"
          onClick={() => onChange(suggestedTask)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-left transition-colors hover:bg-violet-100 dark:hover:bg-violet-500/15"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
          <span className="text-xs text-violet-700 dark:text-violet-300 truncate">
            Suggested: {suggestedTask}
          </span>
          <ChevronRight className="w-3 h-3 text-violet-400 ml-auto flex-shrink-0" />
        </button>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Finish API integration..."
        maxLength={120}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1f1f23] text-sm text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// BLOCKER INPUT
// ─────────────────────────────────────────────────────────────────────────
const BlockerInput = ({ hasBlocker, description, onToggle, onDescriptionChange }) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        Any blockers?
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
            !hasBlocker
              ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300'
              : 'border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 hover:border-teal-300'
          }`}
        >
          All clear ✓
        </button>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
            hasBlocker
              ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              : 'border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 hover:border-red-300'
          }`}
        >
          Blocked ⚠️
        </button>
      </div>

      <AnimatePresence>
        {hasBlocker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="What's blocking you? (optional)"
              maxLength={300}
              rows={2}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-[#1f1f23] text-sm text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────
export default function PulseCheckModal({
  isOpen = false,
  onClose,
  onSubmit,
  isSubmitting = false,
  xpReward = 15,
  suggestedTask = null,
  className = '',
}) {
  const [energy, setEnergy] = useState(null);
  const [focusTask, setFocusTask] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);
  const [blockerDescription, setBlockerDescription] = useState('');

  const canSubmit = energy !== null;

  const handleSubmit = useCallback(() => {
    if (!canSubmit || isSubmitting) return;

    onSubmit?.({
      energy,
      focusTaskId: null, // Could be wired to real task IDs later
      focusTaskText: focusTask,
      blocker: {
        hasBlocker,
        description: hasBlocker ? blockerDescription : '',
      },
    });
  }, [energy, focusTask, hasBlocker, blockerDescription, canSubmit, isSubmitting, onSubmit]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm z-[80]"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[90vw] max-w-md
          bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06]
          rounded-2xl shadow-2xl shadow-violet-500/10 dark:shadow-black/50
          z-[81] overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">
                Daily Pulse
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                30 seconds • +{xpReward} XP
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-5">
          {/* Step 1: Energy */}
          <EnergyPicker selected={energy} onSelect={setEnergy} />

          {/* Step 2: Focus task */}
          <FocusTaskInput
            value={focusTask}
            onChange={setFocusTask}
            suggestedTask={suggestedTask}
          />

          {/* Step 3: Blocker */}
          <BlockerInput
            hasBlocker={hasBlocker}
            description={blockerDescription}
            onToggle={setHasBlocker}
            onDescriptionChange={setBlockerDescription}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`
              w-full py-3.5 rounded-xl font-semibold text-sm transition-all
              flex items-center justify-center gap-2
              ${canSubmit
                ? 'text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
              }
              disabled:opacity-50
            `}
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                : undefined,
            }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Pulse
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px]">
                  +{xpReward} XP
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
