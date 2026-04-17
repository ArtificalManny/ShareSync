// src/components/settings/PersonaPicker.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.1: Settings panel card for persona selection
// Shows 4 persona cards with icon, tone preview, and sample text
// Selecting one saves to backend + updates PersonaContext
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { usePersona } from '../../hooks/usePersona';
import personaLanguage, { PERSONA_IDS } from '../../config/personaLanguage';

// ── Sample text preview for each persona ─────────────────────────────────
function getSamplePreview(id) {
  const p = personaLanguage[id];
  if (!p) return '';
  return `"${p.xp}: 150 — You ${p.shippedVerb} 3 ${p.taskPlural.toLowerCase()} this week!"`;
}

export default function PersonaPicker() {
  const { persona, setPersona } = usePersona();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Experience Mode</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Choose how ShareSync talks to you — same features, different personality
          </p>
        </div>
      </div>

      {/* Persona grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PERSONA_IDS.map((id) => {
          const p = personaLanguage[id];
          const isActive = persona === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setPersona(id)}
              className={`
                relative p-4 rounded-xl border text-left transition-all duration-200
                ${isActive
                  ? 'ring-2 ring-purple-500 border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-purple-500/30'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                </div>
              )}

              {/* Emoji + Label */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">{p.label}</span>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">{p.tone}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">{p.description}</p>

              {/* Sample preview */}
              <div className={`
                px-3 py-2 rounded-lg text-[11px] italic leading-relaxed
                ${isActive
                  ? 'bg-purple-500/10 text-purple-200/80 border border-purple-500/20'
                  : 'bg-slate-800/50 text-slate-500 dark:text-zinc-400 border border-slate-700/50'
                }
              `}>
                {getSamplePreview(id)}
              </div>

              {/* Key terms */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {[
                  { label: p.xp, key: 'xp' },
                  { label: p.task, key: 'task' },
                  { label: p.streak, key: 'streak' },
                ].map(({ label, key }) => (
                  <span
                    key={key}
                    className={`
                      px-2 py-0.5 rounded-full text-[10px] font-medium
                      ${isActive
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                        : 'bg-slate-700/50 text-slate-500 dark:text-zinc-400 border border-slate-700'
                      }
                    `}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-slate-500 text-center">
        💡 You can change this anytime. Your data stays exactly the same — only the language adapts.
      </p>
    </div>
  );
}
