// src/components/focus/FocusBlockScheduler.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.3: Focus Block Scheduler Modal
// ═══════════════════════════════════════════════════════════════════════════════
//
// Pick duration (25/50/90 min), optional task, start immediately or schedule.
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, Target, Zap, Brain, Mountain, Timer, ChevronRight } from 'lucide-react';
import { FOCUS_PRESETS } from '../../hooks/useFocusBlock';

// ─────────────────────────────────────────────────────────────────────────
// PRESET ICONS
// ─────────────────────────────────────────────────────────────────────────
const PRESET_ICONS = {
  Sprint: Zap,
  'Deep Work': Brain,
  Marathon: Mountain,
};

// ─────────────────────────────────────────────────────────────────────────
// DURATION PICKER
// ─────────────────────────────────────────────────────────────────────────
const DurationPicker = ({ selected, onSelect, presets }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        Choose your block
      </p>
      <div className="grid grid-cols-3 gap-3">
        {presets.map((preset) => {
          const isSelected = selected === preset.minutes;
          const Icon = PRESET_ICONS[preset.label] || Timer;

          return (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => onSelect(preset.minutes, preset.label)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 shadow-md scale-[1.02]'
                  : 'border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1f1f23] hover:border-violet-300 dark:hover:border-violet-500/30'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSelected ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-slate-100 dark:bg-[#09090B]'
              }`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}`} />
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-zinc-200'}`}>
                  {preset.minutes}m
                </div>
                <div className={`text-[10px] font-medium ${isSelected ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                  {preset.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom duration */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">or custom</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={5}
          max={180}
          placeholder="Minutes"
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= 5 && val <= 180) onSelect(val, 'Custom');
          }}
          className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1f1f23] text-sm text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <span className="text-xs text-slate-400 dark:text-zinc-500">min</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// TASK PICKER (simplified — uses text input, can be wired to real tasks)
// ─────────────────────────────────────────────────────────────────────────
const TaskPicker = ({ value, onChange, suggestedTasks = [] }) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        What will you focus on?
        <span className="text-slate-400 dark:text-zinc-500 text-xs ml-1">(optional)</span>
      </p>

      {suggestedTasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestedTasks.slice(0, 3).map((task) => (
            <button
              key={task.id || task.title}
              type="button"
              onClick={() => onChange({ title: task.title, id: task.id })}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${value?.id === task.id
                  ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                  : 'border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 hover:border-violet-300'
                }
              `}
            >
              {task.emoji || '◎'} {task.title}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={typeof value === 'string' ? value : value?.title || ''}
        onChange={(e) => onChange({ title: e.target.value, id: null })}
        placeholder="e.g., Finish the dashboard redesign..."
        maxLength={120}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1f1f23] text-sm text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────
export default function FocusBlockScheduler({
  isOpen = false,
  onClose,
  onStart,
  suggestedTasks = [],
  className = '',
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const handleDurationSelect = useCallback((minutes, label) => {
    setSelectedMinutes(minutes);
    setSelectedLabel(label);
  }, []);

  const handleStart = useCallback(() => {
    if (!selectedMinutes) return;
    onStart?.({
      minutes: selectedMinutes,
      task: selectedTask,
      label: selectedLabel,
    });
    // Reset
    setSelectedMinutes(null);
    setSelectedLabel('');
    setSelectedTask(null);
  }, [selectedMinutes, selectedTask, selectedLabel, onStart]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm z-[80]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[90vw] max-w-lg
          bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06]
          rounded-2xl shadow-2xl shadow-violet-500/10 dark:shadow-black/50
          z-[81] overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">
                Start Focus Block
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Deep work mode • 2x XP • Auto-mute
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-5">
          {/* Duration */}
          <DurationPicker
            selected={selectedMinutes}
            onSelect={handleDurationSelect}
            presets={FOCUS_PRESETS}
          />

          {/* Task */}
          <TaskPicker
            value={selectedTask}
            onChange={setSelectedTask}
            suggestedTasks={suggestedTasks}
          />

          {/* What happens */}
          <div className="bg-slate-50 dark:bg-[#09090B] rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
              What happens
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '🔇', text: 'Notifications muted' },
                { icon: '⚡', text: '2x XP on tasks' },
                { icon: '📐', text: 'Sidebar collapses' },
                { icon: '🔥', text: '"In Focus" badge shown' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <span className="text-xs">{item.icon}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!selectedMinutes}
            className={`
              w-full py-3.5 rounded-xl font-semibold text-sm transition-all
              flex items-center justify-center gap-2
              ${selectedMinutes
                ? 'text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
              }
              disabled:opacity-50
            `}
            style={{
              background: selectedMinutes
                ? 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)'
                : undefined,
            }}
          >
            <Play className="w-4 h-4" />
            {selectedMinutes ? `Start ${selectedMinutes}m Focus Block` : 'Pick a duration'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
