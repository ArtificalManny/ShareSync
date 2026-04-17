// src/components/settings/CelebrationStylePicker.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Settings panel for celebration style overrides
// Lets users override their persona defaults for celebrations
// Toggle switches + animation intensity + preview button
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { PartyPopper, Volume2, Smile, Zap, Quote, RotateCcw, Play } from 'lucide-react';
import { getOverrides, saveOverrides, resetOverrides } from '../../hooks/useCelebration';
import { getCelebrationConfig } from '../../config/celebrationConfig';

// ── Toggle ───────────────────────────────────────────────────────────────
function Toggle({ label, description, icon: Icon, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-10 h-5.5 rounded-full transition-all border ${
            checked
              ? 'border-transparent bg-gradient-to-r from-purple-600 to-fuchsia-600'
              : 'border-slate-300 dark:border-zinc-600 bg-slate-200 dark:bg-zinc-700'
          }`}
          style={{ width: '40px', height: '22px' }}
        />
        <div
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
          style={{ left: checked ? '20px' : '3px', top: '3px' }}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-purple-400" />}
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {label}
          </span>
        </div>
        {description && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// ── Intensity selector ───────────────────────────────────────────────────
const INTENSITY_OPTIONS = [
  { value: 'none', label: 'Off', description: 'No animations' },
  { value: 'minimal', label: 'Minimal', description: 'Quick & subtle' },
  { value: 'low', label: 'Low', description: 'Brief animations' },
  { value: 'medium', label: 'Medium', description: 'Balanced' },
  { value: 'high', label: 'High', description: 'Full party mode' },
];

export default function CelebrationStylePicker() {
  // Read current persona from localStorage (same source of truth as PersonaContext)
  const [persona, setPersonaLocal] = useState('creator');
  const [overrides, setOverrides] = useState({});
  const [previewActive, setPreviewActive] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('ss:persona');
      if (cached) setPersonaLocal(cached);
    } catch { /* no-op */ }

    setOverrides(getOverrides());
  }, []);

  // Get effective config (persona defaults merged with overrides)
  const personaDefaults = getCelebrationConfig(persona, 'taskComplete');
  const effective = { ...personaDefaults };
  Object.keys(overrides).forEach((key) => {
    if (overrides[key] !== null && overrides[key] !== undefined) {
      effective[key] = overrides[key];
    }
  });

  const handleToggle = (key, value) => {
    const next = { ...overrides, [key]: value };
    setOverrides(next);
    saveOverrides(next);
  };

  const handleIntensity = (value) => {
    const next = { ...overrides, animationIntensity: value };
    setOverrides(next);
    saveOverrides(next);
  };

  const handleReset = () => {
    resetOverrides();
    setOverrides({});
  };

  const handlePreview = () => {
    setPreviewActive(true);
    // Dispatch a custom event that CelebrationRouter can listen for
    window.dispatchEvent(new CustomEvent('celebration-preview', {
      detail: {
        eventType: 'taskComplete',
        data: { xp: 50, taskTitle: 'Preview Task' },
      },
    }));
    setTimeout(() => setPreviewActive(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Persona indicator */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-zinc-500">
          Defaults from your <span className="text-purple-400 font-medium capitalize">{persona}</span> persona
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-purple-400 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to defaults
        </button>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <Toggle
          icon={PartyPopper}
          label="Confetti"
          description="Colorful confetti burst on completions"
          checked={overrides.confetti ?? personaDefaults.confetti}
          onChange={(v) => handleToggle('confetti', v)}
        />

        <Toggle
          icon={Volume2}
          label="Sound effects"
          description="Play sounds on celebrations"
          checked={overrides.sound ?? personaDefaults.sound}
          onChange={(v) => handleToggle('sound', v)}
        />

        <Toggle
          icon={Smile}
          label="Emoji rain"
          description="Falling emoji overlay on big wins"
          checked={overrides.emojiRain ?? personaDefaults.emojiRain}
          onChange={(v) => handleToggle('emojiRain', v)}
        />

        <Toggle
          icon={Quote}
          label="Inspirational quotes"
          description="Show a creative quote on completions"
          checked={overrides.quotes ?? personaDefaults.quotes}
          onChange={(v) => handleToggle('quotes', v)}
        />
      </div>

      {/* Animation Intensity */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">Animation intensity</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {INTENSITY_OPTIONS.map((opt) => {
            const currentIntensity = overrides.animationIntensity ?? personaDefaults.animationIntensity;
            const isActive = currentIntensity === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleIntensity(opt.value)}
                className={`
                  px-2 py-2 rounded-lg text-center transition-all border text-xs
                  ${isActive
                    ? 'border-purple-400 bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/30'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-500/30 hover:bg-slate-100 dark:hover:bg-white/10'
                  }
                `}
              >
                <div className="font-medium">{opt.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview button */}
      <button
        type="button"
        onClick={handlePreview}
        disabled={previewActive}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
          text-sm font-medium transition-all
          ${previewActive
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-wait'
            : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-300 dark:hover:border-purple-500/30 hover:text-purple-600 dark:hover:text-purple-300'
          }
        `}
      >
        <Play className="w-4 h-4" />
        {previewActive ? 'Playing...' : 'Preview celebration'}
      </button>
    </div>
  );
}
