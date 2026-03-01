// src/hooks/useSmartStart.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.1: Smart Start hook
// Manages: prompt → loading → results → edits → commit
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { generateSmartStart } from '../api/smartStart';

export function useSmartStart() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // ── Generate plan from description ─────────────────────────────────
  const generate = useCallback(async (description, persona = null) => {
    if (!description || description.trim().length < 5) {
      setError('Please describe your project in at least a few words.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await generateSmartStart(description.trim(), persona);
      setResults(data);
      setHasGenerated(true);
      return data;
    } catch (err) {
      const msg = err.message || 'Failed to generate project plan';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Edit a specific task ───────────────────────────────────────────
  const editTask = useCallback((index, updates) => {
    setResults(prev => {
      if (!prev) return prev;
      const tasks = [...prev.tasks];
      if (tasks[index]) {
        tasks[index] = { ...tasks[index], ...updates };
      }
      return { ...prev, tasks };
    });
  }, []);

  // ── Remove a task ──────────────────────────────────────────────────
  const removeTask = useCallback((index) => {
    setResults(prev => {
      if (!prev) return prev;
      const tasks = prev.tasks.filter((_, i) => i !== index);
      return { ...prev, tasks };
    });
  }, []);

  // ── Add a custom task ──────────────────────────────────────────────
  const addTask = useCallback((task) => {
    setResults(prev => {
      if (!prev) return prev;
      return { ...prev, tasks: [...prev.tasks, task] };
    });
  }, []);

  // ── Reorder tasks ──────────────────────────────────────────────────
  const moveTask = useCallback((fromIndex, toIndex) => {
    setResults(prev => {
      if (!prev) return prev;
      const tasks = [...prev.tasks];
      const [moved] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, moved);
      return { ...prev, tasks };
    });
  }, []);

  // ── Reset everything ───────────────────────────────────────────────
  const reset = useCallback(() => {
    setPrompt('');
    setLoading(false);
    setError(null);
    setResults(null);
    setHasGenerated(false);
  }, []);

  return {
    prompt,
    setPrompt,
    loading,
    error,
    results,
    hasGenerated,
    generate,
    editTask,
    removeTask,
    addTask,
    moveTask,
    reset
  };
}
