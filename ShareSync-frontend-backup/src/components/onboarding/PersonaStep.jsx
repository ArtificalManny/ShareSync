// src/components/onboarding/PersonaStep.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.1: Onboarding step for persona selection
// Same 4 personas but styled for the onboarding flow
// Designed to work standalone OR inside an onboarding stepper
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import personaLanguage, { PERSONA_IDS, DEFAULT_PERSONA } from '../../config/personaLanguage';

// ── Sample sentences for onboarding preview ──────────────────────────────
function getOnboardingSample(id) {
  const samples = {
    student: '🎮 Level 5 — You turned in 3 assignments this week!',
    creator: '✨ Stage 5 — You shipped 3 pieces this week!',
    professional: '📊 Tier 5 — 3 deliverables completed this sprint.',
    teamlead: '🚀 Tier 5 — Team deployed 3 sprint goals this week.',
  };
  return samples[id] || samples[DEFAULT_PERSONA];
}

export default function PersonaStep({ onSelect, onSkip, initialPersona }) {
  const [selected, setSelected] = useState(initialPersona || null);

  const handleConfirm = () => {
    if (selected && onSelect) {
      onSelect(selected);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          How do you work best?
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          This changes the language and feel — you can always switch later
        </p>
      </div>

      {/* Persona cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {PERSONA_IDS.map((id) => {
          const p = personaLanguage[id];
          const isSelected = selected === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`
                relative p-5 rounded-2xl border text-left transition-all duration-200
                ${isSelected
                  ? 'ring-2 ring-violet-500 border-violet-400 bg-violet-50 dark:bg-violet-500/10 shadow-lg shadow-violet-500/10'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800/50 hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-md'
                }
              `}
            >
              {/* Active check */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-violet-500" />
                </div>
              )}

              {/* Emoji + Name */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{p.emoji}</span>
                <div>
                  <div className="text-base font-bold text-slate-800 dark:text-white">{p.label}</div>
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">{p.tone}</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">{p.description}</p>

              {/* Sample */}
              <div className={`
                px-3 py-2 rounded-xl text-xs leading-relaxed
                ${isSelected
                  ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20'
                  : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-white/5'
                }
              `}>
                {getOnboardingSample(id)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
          >
            Skip for now →
          </button>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          className={`
            ml-auto inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all
            ${selected
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/20 hover:scale-105'
              : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50'
            }
          `}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
