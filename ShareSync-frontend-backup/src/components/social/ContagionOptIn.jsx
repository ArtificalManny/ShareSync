// src/components/social/ContagionOptIn.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.2: Privacy opt-in card for activity sharing
// ═══════════════════════════════════════════════════════════════════════════════
//
// "Share your activity with teammates" toggle card.
// Can be embedded in Settings or displayed as a first-time prompt.
//
// ZERO BACKEND CHANGES (stores in localStorage for now;
// backend field activitySharingEnabled will sync later)
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Users, Eye, EyeOff, Shield } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function ContagionOptIn({
  optedIn = true,
  onToggle,
  variant = 'default', // 'default' | 'compact' | 'card'
  className = '',
}) {
  const handleToggle = () => {
    if (onToggle) onToggle(!optedIn);
  };

  // ── Compact variant (inline toggle, for settings rows) ──
  if (variant === 'compact') {
    return (
      <label className={`flex items-start gap-3 cursor-pointer group ${className}`}>
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={handleToggle}
            className="sr-only peer"
          />
          {/* Toggle track */}
          <div
            className={`w-11 h-6 rounded-full transition-all border ${
              optedIn
                ? 'border-transparent'
                : 'border-slate-300 dark:border-[#27272a] bg-slate-200 dark:bg-[#1f1f23]'
            }`}
            style={{
              background: optedIn ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : undefined,
            }}
          />
          {/* Toggle thumb */}
          <div
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
            style={{ left: optedIn ? '24px' : '4px' }}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            Share activity with teammates
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
            Let teammates see when you're shipping. You'll see their activity too.
          </div>
        </div>
      </label>
    );
  }

  // ── Card variant (for first-time prompt or settings section) ──
  if (variant === 'card') {
    return (
      <div
        className={`
          p-5 rounded-xl border
          ${optedIn
            ? 'bg-violet-50 dark:bg-violet-500/5 border-violet-200 dark:border-violet-500/20'
            : 'bg-slate-50 dark:bg-[#111113] border-slate-200 dark:border-white/[0.06]'
          }
          transition-colors duration-200
          ${className}
        `}
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            optedIn
              ? 'bg-violet-100 dark:bg-violet-500/20'
              : 'bg-slate-200 dark:bg-zinc-800'
          }`}>
            {optedIn
              ? <Eye className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              : <EyeOff className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1">
              Activity Sharing
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed">
              When enabled, your teammates can see what you're working on in real time.
              This creates a "coffee shop effect" — people ship more when they see others shipping.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggle}
                className={`
                  px-4 py-2 rounded-lg text-xs font-medium transition-all
                  ${optedIn
                    ? 'bg-violet-500 text-white hover:bg-violet-600'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700'
                  }
                `}
              >
                {optedIn ? 'Sharing On' : 'Sharing Off'}
              </button>

              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
                <Shield className="w-3 h-3" />
                <span>Opt-in only • Change anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Default variant (simple inline with icon) ──
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
          ${optedIn
            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20'
            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/10'
          }
        `}
      >
        <Users className="w-3.5 h-3.5" />
        <span>{optedIn ? 'Activity visible' : 'Activity hidden'}</span>
      </button>
    </div>
  );
}
