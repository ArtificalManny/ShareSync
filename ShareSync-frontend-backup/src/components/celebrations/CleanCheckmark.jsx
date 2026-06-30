// src/components/celebrations/CleanCheckmark.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Professional-mode minimal checkmark animation
// Ultra-clean — just a quick checkmark that fades in and out
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function CleanCheckmark({
  show = false,
  duration = 600,
  message = 'Done',
  data = {},
  onComplete,
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      setExiting(false);
      return;
    }

    setVisible(true);
    setExiting(false);

    // Start exit
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 200);

    // Fully hide
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9998] flex items-start justify-center"
      aria-hidden="true"
    >
      {/* Toast-style notification at top */}
      <div
        className={`
          mt-20 px-5 py-3 rounded-xl
          bg-white dark:bg-zinc-800
          border border-slate-200 dark:border-white/10
          shadow-lg shadow-slate-900/5 dark:shadow-black/20
          flex items-center gap-3
          transition-all
          ${exiting
            ? 'opacity-0 -translate-y-2 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
          }
        `}
        style={{
          transitionDuration: '200ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center"
          style={{
            animation: 'checkmark-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-white">
            {message}
          </p>
          {data.xp && (
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              +{data.xp} pts
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes checkmark-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          Available { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
