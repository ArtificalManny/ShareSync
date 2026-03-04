// src/components/onboarding/FirstMission.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 1: "First Mission" prompt — shown on Home when user has no tasks
// ⭐ Phase 4: Ruthless Efficiency (1-Click Inline Entry / Zero Friction)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Phase 4: Single input state mapping
  const [inputValue, setInputValue] = useState("");
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

  // ── Handle Immediate Submit (Phase 4 Zero-Friction) ────────────────────
  const handleImmediateSubmit = async (titleToSubmit) => {
    const finalTitle = titleToSubmit || inputValue;
    if (!finalTitle.trim() || creating || created) return;
    
    setCreating(true);

    try {
      // Tell onboarding context about the first task
      onboarding?.setFirstTask?.({ title: finalTitle.trim(), description: '' });

      // Signal parent to create the task immediately
      if (onMissionCreated) {
        await onMissionCreated({
          title: finalTitle.trim(),
          description: '',
          projectId: projectId || null,
        });
      }

      setCreated(true);
    } catch (err) {
      console.error('[FirstMission] Failed to create task:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleImmediateSubmit();
  };

  // ── Don't render if onboarding is complete and user already has tasks ──
  // Parent controls visibility; this component just renders its UI

  if (created) {
    return (
      <div className="p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10 ring-1 ring-teal-200 dark:ring-teal-500/20 text-center shadow-[0_0_15px_rgba(20,184,166,0.15)]">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="text-xl font-semibold text-teal-800 dark:text-teal-300 mb-2 tracking-tightest">
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
    <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f23] ring-1 ring-slate-200 dark:ring-white/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 dark:bg-white shadow-sm">
          <Rocket className="w-5 h-5 text-white dark:text-slate-900" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tightest">What's your first mission?</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Press enter to immediately deploy to the system.</p>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-200 dark:ring-violet-500/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400">+25 XP</span>
        </div>
      </div>

      {/* Phase 4: Zero Friction Inline Form */}
      <form onSubmit={handleFormSubmit} className="relative flex items-center mb-5">
        <input 
          autoFocus
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. Write API endpoints..."
          className="w-full bg-slate-50 dark:bg-zinc-800/50 ring-1 ring-slate-200 dark:ring-white/10 text-slate-900 dark:text-white text-base px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:text-slate-400"
          disabled={creating}
        />
        <button 
          type="submit"
          disabled={!inputValue.trim() || creating}
          className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium text-sm shadow-sm"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Ship</>}
        </button>
      </form>

      {/* 1-Click Fast Fill Pills */}
      <div className="flex flex-wrap gap-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-32 bg-slate-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
          ))
        ) : (
          suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleImmediateSubmit(s.title)}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-zinc-800/50 ring-1 ring-slate-200 dark:ring-white/10 text-slate-600 dark:text-zinc-300 hover:ring-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all disabled:opacity-50"
            >
              <span>{s.emoji}</span>
              <span>{s.title}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
