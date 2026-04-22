// src/components/tasks/QuickAddModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.1: Full-featured task creation modal
// Triggered by N keyboard shortcut (via useQuickAdd hook)
// Title, description, project selector, priority, due date, tags
// Fully keyboard-navigable: Tab between fields, Enter to submit, Esc to close
//
// ASSIGNMENT PASS:
// - Keeps existing assignee select
// - Normalizes teamMembers so nested member shapes work safely
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  X, Plus, Calendar, Flag, FolderOpen, Tag,
  ChevronDown, AlertCircle, Loader2,
} from 'lucide-react';

// ── Priority options ─────────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'none', label: 'No priority', color: 'text-slate-400', dot: 'bg-slate-300 dark:bg-zinc-600', ring: 'ring-slate-300' },
  { value: 'low', label: 'Low', color: 'text-blue-500', dot: 'bg-blue-500', ring: 'ring-blue-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500', dot: 'bg-amber-500', ring: 'ring-amber-500' },
  { value: 'high', label: 'High', color: 'text-orange-500', dot: 'bg-orange-500', ring: 'ring-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500', dot: 'bg-red-500', ring: 'ring-red-500' },
];

// ── Status options ───────────────────────────────────────────────────────
const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
];

function normalizeId(v) {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (v?._id) return String(v._id).trim();
  if (v?.id) return String(v.id).trim();
  return v?.toString?.()?.trim?.() || '';
}

function normalizeMemberOptions(list) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const normalized = [];

  for (const member of list) {
    const user = member?.userId || member?.user || member;
    const id = normalizeId(user?._id || user?.id || member?.id || member?._id);
    if (!id || seen.has(id)) continue;

    seen.add(id);

    const name =
      user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      user?.username ||
      user?.email ||
      member?.name ||
      member?.email ||
      'Team member';

    normalized.push({
      id,
      name,
      email: user?.email || member?.email || '',
      role: member?.role || user?.role || '',
    });
  }

  return normalized;
}

export default function QuickAddModal({
  isOpen = false,
  onClose,
  onSubmit,
  projects = [],
  defaultProjectId = null,
  teamMembers = [],
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [priority, setPriority] = useState('none');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const memberOptions = useMemo(() => normalizeMemberOptions(teamMembers), [teamMembers]);

  const titleRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setProjectId(defaultProjectId);
      setPriority('none');
      setStatus('todo');
      setDueDate('');
      setTagInput('');
      setTags([]);
      setAssigneeId('');
      setError('');
      setSubmitting(false);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, defaultProjectId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTagKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/,/g, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags((prev) => [...prev, trimmed]);
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    setError('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required');
      titleRef.current?.focus();
      return;
    }

    const targetProjectId = projectId || defaultProjectId;
    if (!targetProjectId) {
      setError('Please select a project');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        title: trimmedTitle,
        description: description.trim() || undefined,
        projectId: targetProjectId,
        priority: priority !== 'none' ? priority : undefined,
        status: status || 'todo',
        dueDate: dueDate || undefined,
        tags: tags.length > 0 ? tags : undefined,
        assigneeId: assigneeId || undefined,
      });
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }, [title, description, projectId, defaultProjectId, priority, status, dueDate, tags, assigneeId, onSubmit, onClose]);

  const handleFormKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => (p.id || p._id) === projectId);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-[80] animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[81] flex items-start justify-center pt-[10vh] px-4">
        <div
          ref={modalRef}
          className="
            w-full max-w-lg
            bg-white dark:bg-[#1a1a1e]
            border border-slate-200 dark:border-white/10
            rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40
            animate-in fade-in slide-in-from-top-4 duration-200
          "
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleFormKeyDown}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">New Task</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            <div>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="
                  w-full px-0 py-1 text-lg font-medium
                  bg-transparent
                  text-slate-800 dark:text-white
                  placeholder-slate-300 dark:placeholder-zinc-600
                  border-none outline-none
                "
              />
            </div>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="
                  w-full px-3 py-2.5 rounded-xl text-sm
                  bg-slate-50 dark:bg-white/5
                  border border-slate-200 dark:border-white/10
                  text-slate-700 dark:text-zinc-200
                  placeholder-slate-400 dark:placeholder-zinc-600
                  outline-none focus:border-violet-300 dark:focus:border-violet-500/40
                  focus:ring-1 focus:ring-violet-300 dark:focus:ring-violet-500/30
                  resize-none transition-colors
                "
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Project
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={projectId || ''}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="
                      w-full pl-8 pr-8 py-2 rounded-xl text-sm appearance-none
                      bg-slate-50 dark:bg-white/5
                      border border-slate-200 dark:border-white/10
                      text-slate-700 dark:text-zinc-200
                      outline-none focus:border-violet-300 dark:focus:border-violet-500/40
                      cursor-pointer transition-colors
                    "
                  >
                    <option value="">Select project...</option>
                    {projects.map((proj) => {
                      const id = proj.id || proj._id;
                      return (
                        <option key={id} value={id}>
                          {proj.name || proj.title}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="
                      w-full px-3 pr-8 py-2 rounded-xl text-sm appearance-none
                      bg-slate-50 dark:bg-white/5
                      border border-slate-200 dark:border-white/10
                      text-slate-700 dark:text-zinc-200
                      outline-none focus:border-violet-300 dark:focus:border-violet-500/40
                      cursor-pointer transition-colors
                    "
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Priority
                </label>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="
                      w-full pl-8 pr-8 py-2 rounded-xl text-sm appearance-none
                      bg-slate-50 dark:bg-white/5
                      border border-slate-200 dark:border-white/10
                      text-slate-700 dark:text-zinc-200
                      outline-none focus:border-violet-300 dark:focus:border-violet-500/40
                      cursor-pointer transition-colors
                    "
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="
                      w-full pl-8 pr-3 py-2 rounded-xl text-sm
                      bg-slate-50 dark:bg-white/5
                      border border-slate-200 dark:border-white/10
                      text-slate-700 dark:text-zinc-200
                      outline-none focus:border-violet-300 dark:focus:border-violet-500/40
                      transition-colors
                    "
                  />
                </div>
              </div>
            </div>

            {memberOptions.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Assignee
                </label>
                <div className="relative">
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="
                      w-full px-3 pr-8 py-2 rounded-xl text-sm appearance-none
                      bg-slate-50 dark:bg-white/5
                      border border-slate-200 dark:border-white/10
                      text-slate-700 dark:text-zinc-200
                      outline-none focus:border-violet-300 dark:focus:border-violet-500/40
                      cursor-pointer transition-colors
                    "
                  >
                    <option value="">Unassigned</option>
                    {memberOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}{member.role ? ` · ${member.role}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Tags
              </label>
              <div className="
                flex flex-wrap items-center gap-1.5
                px-3 py-2 rounded-xl
                bg-slate-50 dark:bg-white/5
                border border-slate-200 dark:border-white/10
                focus-within:border-violet-300 dark:focus-within:border-violet-500/40
                transition-colors
              ">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="
                      flex items-center gap-1 px-2 py-0.5 rounded-md
                      bg-violet-100 dark:bg-violet-500/15
                      text-violet-700 dark:text-violet-300
                      text-xs font-medium
                    "
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? 'Add tags (press Enter)...' : ''}
                  className="
                    flex-1 min-w-[80px] bg-transparent text-sm
                    text-slate-700 dark:text-zinc-200
                    placeholder-slate-400 dark:placeholder-zinc-600
                    outline-none
                  "
                />
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                ⌘ Enter
              </kbd>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">to create</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  text-slate-600 dark:text-zinc-300
                  hover:bg-slate-100 dark:hover:bg-white/5
                  transition-colors
                "
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                className="
                  flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                  bg-violet-600 text-white
                  hover:bg-violet-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
