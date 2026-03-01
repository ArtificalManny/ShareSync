// src/components/projects/SmartStart.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.1: Smart Start — AI-powered project setup
// Text input → AI generates tasks, timeline, milestones → editable preview → commit
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lightbulb, Wand2 } from 'lucide-react';
import { useSmartStart } from '../../hooks/useSmartStart';
import SmartStartPreview from './SmartStartPreview';
import SmartStartSkeleton from './SmartStartSkeleton';

const EXAMPLE_PROMPTS = [
  'A task management app for small teams with Kanban boards',
  'An e-commerce store for handmade jewelry with Stripe checkout',
  'A fitness tracking mobile app with social challenges',
  'A blog platform with markdown editor and SEO tools',
];

export default function SmartStart({ onAccept, onCancel, persona }) {
  const {
    prompt,
    setPrompt,
    loading,
    error,
    results,
    hasGenerated,
    generate,
    editTask,
    removeTask,
    moveTask,
    reset
  } = useSmartStart();

  const [exampleIndex] = useState(() => Math.floor(Math.random() * EXAMPLE_PROMPTS.length));

  const handleGenerate = () => {
    generate(prompt, persona);
  };

  const handleAccept = () => {
    if (results && onAccept) {
      onAccept(results);
    }
  };

  const handleRegenerate = () => {
    generate(prompt, persona);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && prompt.trim().length >= 5 && !loading) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // ── PHASE 1: Input ─────────────────────────────────────────────────
  if (!hasGenerated && !loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Smart Start</h3>
            <p className="text-xs text-slate-400">Describe your project and AI will generate a plan</p>
          </div>
        </div>

        {/* Text input */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            What are you building?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={EXAMPLE_PROMPTS[exampleIndex]}
            rows={3}
            className="w-full rounded-xl border border-purple-500/30 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              {prompt.trim().length < 5
                ? `${5 - prompt.trim().length} more characters needed`
                : 'Press Enter or click Generate'
              }
            </p>
            {prompt.trim().length < 5 && (
              <button
                type="button"
                onClick={() => setPrompt(EXAMPLE_PROMPTS[exampleIndex])}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3" />
                Try example
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Back to manual
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={prompt.trim().length < 5}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ml-auto"
          >
            <Sparkles className="w-4 h-4" />
            Generate Plan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE 2: Loading ───────────────────────────────────────────────
  if (loading) {
    return <SmartStartSkeleton />;
  }

  // ── PHASE 3: Preview & Edit ────────────────────────────────────────
  return (
    <SmartStartPreview
      results={results}
      onEditTask={editTask}
      onRemoveTask={removeTask}
      onMoveTask={moveTask}
      onAccept={handleAccept}
      onRegenerate={handleRegenerate}
      loading={loading}
    />
  );
}
