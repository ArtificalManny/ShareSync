// src/hooks/useQuickAdd.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.1: Quick-add state management hook
//
// Manages modal open/close, keyboard shortcut (N key), API submission,
// and optimistic UI insertion with error rollback.
//
// Usage:
//   const quickAdd = useQuickAdd({ defaultProjectId, onTaskCreated });
//   <QuickAddModal isOpen={quickAdd.isOpen} onClose={quickAdd.close} onSubmit={quickAdd.submit} />
//   <QuickAddBar onSubmit={quickAdd.submit} />
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { createTask } from '../api/tasks';

export function useQuickAdd({
  defaultProjectId = null,
  onTaskCreated = null,
  onError = null,
  enableKeyboardShortcut = true,
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const suppressNextRef = useRef(false);

  // ── Open / Close ───────────────────────────────────────────────────
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ── Temporarily suppress the N shortcut ────────────────────────────
  // Call this when user is typing in an unrelated input
  const suppressShortcut = useCallback(() => {
    suppressNextRef.current = true;
  }, []);

  // ── Keyboard shortcut: N to open modal ─────────────────────────────
  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    const handleKeyDown = (e) => {
      // Don't fire when typing in inputs, textareas, contenteditable, or selects
      const tag = e.target?.tagName?.toLowerCase();
      const isEditable = e.target?.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable) {
        return;
      }

      // Don't fire if modifier keys are held (except shift)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Don't fire if suppressed
      if (suppressNextRef.current) {
        suppressNextRef.current = false;
        return;
      }

      // N = open quick add modal
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcut]);

  // ── Submit task ────────────────────────────────────────────────────
  const submit = useCallback(async (taskData) => {
    const { projectId, title, description, priority, status, dueDate, tags, assigneeId } = taskData;

    const targetProjectId = projectId || defaultProjectId;
    if (!targetProjectId) {
      throw new Error('No project selected');
    }
    if (!title?.trim()) {
      throw new Error('Task title is required');
    }

    setIsSubmitting(true);

    // Build payload (only include defined fields)
    const payload = { title: title.trim() };
    if (description) payload.description = description;
    if (priority) payload.priority = priority;
    if (status) payload.status = status;
    if (dueDate) payload.dueDate = dueDate;
    if (tags && tags.length > 0) payload.tags = tags;
    if (assigneeId) payload.assignedToId = assigneeId;

    try {
      // Use existing createTask API → POST /projects/:projectId/tasks
      const created = await createTask(targetProjectId, payload);

      setLastCreated(created);

      // Notify parent (for optimistic UI refresh)
      onTaskCreated?.(created);

      // Fire global event so other components can react (Home, Kanban, etc.)
      try {
        window.dispatchEvent(
          new CustomEvent('task-created', {
            detail: { task: created, projectId: targetProjectId },
          })
        );
      } catch { /* non-fatal */ }

      return created;
    } catch (err) {
      console.error('[useQuickAdd] Failed to create task:', err);
      onError?.(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [defaultProjectId, onTaskCreated, onError]);

  // ── Quick submit (title-only, for QuickAddBar minimal usage) ───────
  const quickSubmit = useCallback(async (title, projectId) => {
    return submit({
      title,
      projectId: projectId || defaultProjectId,
    });
  }, [submit, defaultProjectId]);

  return {
    // State
    isOpen,
    isSubmitting,
    lastCreated,

    // Actions
    open,
    close,
    toggle,
    submit,
    quickSubmit,
    suppressShortcut,
  };
}

export default useQuickAdd;
