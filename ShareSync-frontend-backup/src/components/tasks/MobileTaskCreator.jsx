// src/components/tasks/MobileTaskCreator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.5: Thumb-friendly task creation sheet
// Slides up from bottom (like iOS share sheet). Large touch targets (44px min).
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Plus, Flag, Calendar, Folder, ChevronDown } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: null, label: 'None', color: 'bg-slate-300 dark:bg-zinc-600' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

const QUICK_DATES = [
  { label: 'Today', offsetDays: 0 },
  { label: 'Tomorrow', offsetDays: 1 },
  { label: 'Next week', offsetDays: 7 },
];

export default function MobileTaskCreator({
  isOpen = false,
  onClose,
  onSubmit,
  projects = [],
  defaultProjectId = null,
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [submitting, setSubmitting] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const inputRef = useRef(null);

  // Reset and focus on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setPriority(null);
      setDueDate(null);
      setProjectId(defaultProjectId);
      setSubmitting(false);
      setShowProjects(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, defaultProjectId]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const handleQuickDate = useCallback((offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(23, 59, 0, 0);
    setDueDate(d);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit?.({
        title: title.trim(),
        priority,
        dueDate: dueDate?.toISOString() || null,
        projectId: projectId || defaultProjectId,
      });
      onClose?.();
    } catch (err) {
      console.error('[MobileTaskCreator] Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }, [title, priority, dueDate, projectId, defaultProjectId, submitting, onSubmit, onClose]);

  const selectedProject = projects.find((p) => (p.id || p._id) === projectId);
  const dueDateLabel = dueDate
    ? dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[100]
          bg-black/40 backdrop-blur-sm
          transition-opacity duration-200
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[101]
          bg-white dark:bg-[#1a1a1e]
          border-t border-slate-200 dark:border-white/10
          rounded-t-2xl
          shadow-2xl shadow-black/20
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: '85vh',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            New Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-slate-400 active:bg-slate-100 dark:active:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title input */}
        <div className="px-5 pb-4">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="What needs to be done?"
            className="
              w-full px-4 py-3.5 rounded-xl text-base
              bg-slate-50 dark:bg-white/5
              border border-slate-200 dark:border-white/10
              text-slate-800 dark:text-white
              placeholder-slate-400 dark:placeholder-zinc-600
              outline-none focus:border-violet-300 dark:focus:border-violet-500/40
              transition-colors
            "
          />
        </div>

        {/* Quick options row */}
        <div className="px-5 pb-4 space-y-3">
          {/* Project selector */}
          <button
            type="button"
            onClick={() => setShowProjects(!showProjects)}
            className="
              w-full flex items-center gap-3
              px-4 py-3 rounded-xl
              bg-slate-50 dark:bg-white/5
              border border-slate-200 dark:border-white/10
              text-left
              active:bg-slate-100 dark:active:bg-white/10
              transition-colors
            "
          >
            <Folder className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
            <span className="flex-1 text-sm text-slate-600 dark:text-zinc-300 truncate">
              {selectedProject ? (selectedProject.name || selectedProject.title) : 'Select project'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProjects ? 'rotate-180' : ''}`} />
          </button>

          {/* Project list (expandable) */}
          {showProjects && projects.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e]">
              {projects.map((p) => {
                const pid = p.id || p._id;
                const active = pid === projectId;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => { setProjectId(pid); setShowProjects(false); }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                      transition-colors
                      ${active
                        ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        : 'text-slate-600 dark:text-zinc-300 active:bg-slate-50 dark:active:bg-white/5'
                      }
                    `}
                  >
                    <div className={`w-3 h-3 rounded-sm ${p.color || 'bg-violet-500'}`} />
                    <span className="truncate">{p.name || p.title || 'Untitled'}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Priority chips */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block px-1">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const active = priority === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setPriority(active ? null : opt.value)}
                    className={`
                      flex items-center gap-1.5
                      px-3 py-2.5 rounded-xl
                      text-xs font-medium
                      min-h-[44px]
                      transition-colors
                      ${active
                        ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/10 active:bg-slate-100'
                      }
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date chips */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block px-1">
              Due Date
            </label>
            <div className="flex gap-2">
              {QUICK_DATES.map((qd) => {
                const target = new Date();
                target.setDate(target.getDate() + qd.offsetDays);
                target.setHours(23, 59, 0, 0);
                const active = dueDate && dueDate.getDate() === target.getDate() && dueDate.getMonth() === target.getMonth();

                return (
                  <button
                    key={qd.label}
                    type="button"
                    onClick={() => handleQuickDate(qd.offsetDays)}
                    className={`
                      flex items-center gap-1.5
                      px-3 py-2.5 rounded-xl
                      text-xs font-medium
                      min-h-[44px]
                      transition-colors
                      ${active
                        ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/10 active:bg-slate-100'
                      }
                    `}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {qd.label}
                  </button>
                );
              })}
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate(null)}
                  className="px-3 py-2.5 rounded-xl text-xs text-red-500 active:bg-red-50 dark:active:bg-red-500/5 min-h-[44px]"
                >
                  Clear
                </button>
              )}
            </div>
            {dueDateLabel && (
              <p className="text-[11px] text-violet-500 font-medium mt-1.5 px-1">
                Due {dueDateLabel}
              </p>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className="px-5 pb-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="
              w-full flex items-center justify-center gap-2
              py-4 rounded-xl
              bg-violet-600 dark:bg-violet-500
              text-white text-base font-semibold
              min-h-[56px]
              active:bg-violet-700 dark:active:bg-violet-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors shadow-lg shadow-violet-500/20
            "
          >
            <Plus className="w-5 h-5" />
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  );
}
