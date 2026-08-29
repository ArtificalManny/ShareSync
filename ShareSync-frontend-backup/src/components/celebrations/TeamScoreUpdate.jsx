// src/components/celebrations/TeamScoreUpdate.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Team Lead mode scoreboard / capacity notification
// Shows a brief team-oriented update: "Team deployed Sprint Goal" + stats
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Zap } from 'lucide-react';

export default function TeamScoreUpdate({
  show = false,
  duration = 1200,
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

    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 300);

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

  const title = data.title || 'Goal closed';
  const teamName = data.teamName || 'Team';
  const capacityFreed = data.capacityFreed || null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9998] flex items-start justify-center"
      aria-hidden="true"
    >
      <div
        className={`
          mt-20 px-5 py-4 rounded-xl
          bg-white dark:bg-zinc-800
          border border-slate-200 dark:border-white/10
          shadow-lg shadow-slate-900/5 dark:shadow-black/20
          max-w-sm w-full mx-4
          transition-all
          ${exiting
            ? 'opacity-0 -translate-y-2 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
          }
        `}
        style={{
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {title}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              {teamName} Scoreboard Update
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          {data.xp && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                +{data.xp} TM
              </span>
            </div>
          )}

          {capacityFreed && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                {capacityFreed} capacity freed
              </span>
            </div>
          )}
        </div>

        {/* Subtle progress indicator */}
        <div className="mt-3 h-0.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full"
            style={{
              animation: `team-progress ${duration - 300}ms ease-out forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes team-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
