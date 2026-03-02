// src/components/tasks/QuickAddBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.1: Persistent quick-add input bar
// Always visible at top of task views. Type title, hit Enter to create.
// Collapses to a slim "+ New Task" pill when not focused.
// Supports due date shorthand: "tomorrow", "fri", "2d", "1w"
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Calendar, Flag, FolderOpen, X, ChevronDown } from 'lucide-react';

// ── Due date shorthand parser ────────────────────────────────────────────
const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const FULL_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseDueShorthand(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.trim().toLowerCase();

  // "today"
  if (lower === 'today' || lower === 'tod') {
    return new Date();
  }

  // "tomorrow" / "tom"
  if (lower === 'tomorrow' || lower === 'tom') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  // "Xd" — days from now (e.g. "2d", "3d")
  const daysMatch = lower.match(/^(\d+)d$/);
  if (daysMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(daysMatch[1], 10));
    return d;
  }

  // "Xw" — weeks from now (e.g. "1w", "2w")
  const weeksMatch = lower.match(/^(\d+)w$/);
  if (weeksMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(weeksMatch[1], 10) * 7);
    return d;
  }

  // Day name — "mon", "tue", "friday", etc → next occurrence
  let dayIndex = DAY_NAMES.indexOf(lower.slice(0, 3));
  if (dayIndex === -1) dayIndex = FULL_DAY_NAMES.indexOf(lower);
  if (dayIndex !== -1) {
    const d = new Date();
    const today = d.getDay();
    let diff = dayIndex - today;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  return null;
}

function formatShortDate(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Priority config ──────────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'none', label: 'No priority', color: 'text-slate-400 dark:text-zinc-500', dot: 'bg-slate-300 dark:bg-zinc-600' },
  { value: 'low', label: 'Low', color: 'text-blue-500', dot: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500', dot: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'text-orange-500', dot: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500', dot: 'bg-red-500' },
];

export default function QuickAddBar({
  onSubmit,
  projects = [],
  defaultProjectId = null,
  placeholder = 'Add a task... (type "2d" or "fri" for due date)',
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [dueText, setDueText] = useState('');
  const [parsedDue, setParsedDue] = useState(null);
  const [priority, setPriority] = useState('none');
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef(null);
  const barRef = useRef(null);

  // Update default project when prop changes
  useEffect(() => {
    if (defaultProjectId && !projectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId, projectId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setShowPriorityPicker(false);
        setShowProjectPicker(false);
        // Only collapse if title is empty
        if (!title.trim()) {
          setExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title]);

  // Parse due date shorthand as user types
  const handleDueChange = useCallback((val) => {
    setDueText(val);
    const parsed = parseDueShorthand(val);
    setParsedDue(parsed);
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setDueText('');
    setParsedDue(null);
    setPriority('none');
    setShowPriorityPicker(false);
    setShowProjectPicker(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    // Determine which project to use
    const targetProjectId = projectId || defaultProjectId;
    if (!targetProjectId) {
      console.warn('[QuickAddBar] No project selected');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        title: trimmed,
        projectId: targetProjectId,
        priority: priority !== 'none' ? priority : undefined,
        dueDate: parsedDue ? parsedDue.toISOString() : undefined,
      });
      resetForm();
      // Keep bar expanded so user can add more
    } catch (err) {
      console.error('[QuickAddBar] Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [title, projectId, defaultProjectId, priority, parsedDue, submitting, onSubmit, resetForm]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      resetForm();
      setExpanded(false);
      inputRef.current?.blur();
    }
  }, [handleSubmit, resetForm]);

  const selectedProject = projects.find((p) => p.id === projectId || p._id === projectId);
  const selectedPriority = PRIORITIES.find((p) => p.value === priority) || PRIORITIES[0];

  // ── Collapsed pill ─────────────────────────────────────────────────
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-white dark:bg-[#1f1f23]
          border border-dashed border-slate-300 dark:border-zinc-600
          text-slate-400 dark:text-zinc-500
          hover:border-violet-300 dark:hover:border-violet-500/40
          hover:text-violet-500 dark:hover:text-violet-400
          hover:bg-violet-50 dark:hover:bg-violet-500/5
          transition-all duration-200 group
          ${className}
        `}
      >
        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">New Task</span>
      </button>
    );
  }

  // ── Expanded bar ───────────────────────────────────────────────────
  return (
    <div
      ref={barRef}
      className={`
        rounded-xl border
        bg-white dark:bg-[#1f1f23]
        border-violet-200 dark:border-violet-500/30
        shadow-lg shadow-violet-500/5
        transition-all duration-200
        ${className}
      `}
    >
      {/* Main input row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Plus className="w-4 h-4 text-violet-500 flex-shrink-0" />

        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          className="
            flex-1 bg-transparent text-sm
            text-slate-800 dark:text-white
            placeholder-slate-400 dark:placeholder-zinc-500
            outline-none
          "
        />

        {title.trim() && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="
              px-3 py-1 rounded-lg text-xs font-medium
              bg-violet-600 text-white
              hover:bg-violet-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {submitting ? '...' : 'Add'}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            resetForm();
            setExpanded(false);
          }}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Options row */}
      <div className="flex items-center gap-2 px-4 pb-3 border-t border-slate-100 dark:border-white/5 pt-2">
        {/* Due date input */}
        <div className="relative flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={dueText}
            onChange={(e) => handleDueChange(e.target.value)}
            placeholder="Due date..."
            className="
              w-24 bg-transparent text-xs
              text-slate-600 dark:text-zinc-300
              placeholder-slate-400 dark:placeholder-zinc-600
              outline-none
            "
          />
          {parsedDue && (
            <span className="text-[10px] font-medium text-violet-500 bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded">
              {formatShortDate(parsedDue)}
            </span>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />

        {/* Priority picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowPriorityPicker(!showPriorityPicker);
              setShowProjectPicker(false);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${selectedPriority.dot}`} />
            <span className={`text-xs ${selectedPriority.color}`}>{selectedPriority.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPriorityPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 w-36 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 shadow-xl">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPriority(p.value);
                    setShowPriorityPicker(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left
                    hover:bg-slate-50 dark:hover:bg-white/5 transition-colors
                    ${priority === p.value ? 'bg-violet-50 dark:bg-violet-500/10' : ''}
                  `}
                >
                  <div className={`w-2 h-2 rounded-full ${p.dot}`} />
                  <span className={p.color}>{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />

        {/* Project picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProjectPicker(!showProjectPicker);
              setShowPriorityPicker(false);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-zinc-400 max-w-[100px] truncate">
              {selectedProject?.name || selectedProject?.title || 'Project...'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showProjectPicker && projects.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-50 w-48 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 shadow-xl max-h-48 overflow-y-auto">
              {projects.map((proj) => {
                const id = proj.id || proj._id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setProjectId(id);
                      setShowProjectPicker(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left
                      hover:bg-slate-50 dark:hover:bg-white/5 transition-colors
                      ${projectId === id ? 'bg-violet-50 dark:bg-violet-500/10' : ''}
                    `}
                  >
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: proj.color || '#7C3AED' }}
                    />
                    <span className="text-slate-700 dark:text-zinc-200 truncate">
                      {proj.name || proj.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="ml-auto hidden sm:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
            Enter
          </kbd>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">to add</span>
        </div>
      </div>
    </div>
  );
}
