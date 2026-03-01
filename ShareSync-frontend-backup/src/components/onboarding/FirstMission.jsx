// src/components/onboarding/FirstMission.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 1: "First Mission" prompt — shown on Home when user has no tasks
// Guides new users to create their first task with smart suggestions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Zap, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { getSmartSuggestions } from '../../api/tasks';
import { useOnboardingContext } from '../../context/OnboardingContext';

// ── Fallback suggestions if backend is empty ─────────────────────────────
const FALLBACK_SUGGESTIONS = [
  { title: 'Set up project README', description: 'Document your project goals and structure', emoji: '📝', category: 'setup' },
  { title: 'Create a landing page wireframe', description: 'Sketch out the first screen users will see', emoji: '🎨', category: 'design' },
  { title: 'Write your first API endpoint', description: 'Build the foundation of your backend', emoji: '⚡', category: 'code' },
  { title: 'Define 3 user stories', description: 'Clarify what your users need most', emoji: '👥', category: 'planning' },
];

export default function FirstMission({ onMissionCreated, projectId }) {
  const navigate = useNavigate();
  const onboarding = useOnboardingContext();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // ── Load suggestions ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const archetype = onboarding?.data?.archetype || null;
        const results = await getSmartSuggestions(archetype);
        if (!cancelled) {
          setSuggestions(results.length > 0 ? results.slice(0, 4) : FALLBACK_SUGGESTIONS);
        }
      } catch (err) {
        console.warn('[FirstMission] Failed to load suggestions:', err?.message);
        if (!cancelled) setSuggestions(FALLBACK_SUGGESTIONS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [onboarding?.data?.archetype]);

  // ── Handle selection ───────────────────────────────────────────────────
  const handleSelect = useCallback(async (index) => {
    if (creating || created) return;
    setSelectedIndex(index);
    setCreating(true);

    const suggestion = suggestions[index];
    try {
      // Tell onboarding context about the first task
      onboarding?.setFirstTask?.(suggestion);

      // Signal parent to create the task
      if (onMissionCreated) {
        await onMissionCreated({
          title: suggestion.title,
          description: suggestion.description || '',
          projectId: projectId || null,
        });
      }

      setCreated(true);
    } catch (err) {
      console.error('[FirstMission] Failed to create task:', err);
      setSelectedIndex(null);
    } finally {
      setCreating(false);
    }
  }, [suggestions, creating, created, onMissionCreated, projectId, onboarding]);

  // ── Don't render if onboarding is complete and user already has tasks ──
  // Parent controls visibility; this component just renders its UI

  if (created) {
    return (
      <div className="p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10 border border-teal-200 dark:border-teal-500/20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="text-xl font-semibold text-teal-800 dark:text-teal-300 mb-2">
          First mission created! 🎉
        </h3>
        <p className="text-sm text-teal-600 dark:text-teal-400 mb-6">
          You're on the board. Complete it to earn your first XP.
        </p>
        <button
          onClick={() => navigate(projectId ? `/projects/${projectId}` : '/projects')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-md transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
        >
          Go to project
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
      style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
        >
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Pick Your First Mission</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Choose one to get on the board and start earning XP</p>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400">+25 XP</span>
        </div>
      </div>

      {/* Suggestions grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-full" />
            </div>
          ))
        ) : (
          suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={creating}
              className={`
                p-4 rounded-xl text-left transition-all duration-200 border
                ${selectedIndex === i
                  ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30 ring-2 ring-violet-200 dark:ring-violet-500/20'
                  : 'bg-slate-50 dark:bg-zinc-800/50 border-slate-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/20 hover:bg-violet-50/50 dark:hover:bg-violet-500/5'
                }
                disabled:opacity-50
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{s.emoji || '⚡'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.title}</div>
                  {s.description && (
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{s.description}</div>
                  )}
                </div>
                {creating && selectedIndex === i && (
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin mt-0.5 shrink-0" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Skip option */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/projects')}
          className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
        >
          or create your own from scratch →
        </button>
      </div>
    </div>
  );
}
