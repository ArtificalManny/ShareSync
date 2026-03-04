// src/components/shortcuts/ShortcutGuide.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.4: Keyboard shortcuts reference modal
// Opened by pressing ? key. Shows all shortcuts in a categorized grid.
// Reads from config/shortcuts.js (single source of truth).
// Uses the ShortcutProvider context for open/close state.
// ⭐ PHASE 7.4: Premium Glass Morphism Upgrade
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback, useMemo } from 'react';
import { X, Keyboard } from 'lucide-react';
import { getShortcutsByCategory } from '../../config/shortcuts';
import { formatShortcut } from '../../hooks/useKeyboardShortcuts';
import { useShortcutContext } from './ShortcutProvider';

// ── Key badge component ──────────────────────────────────────────────────
function KeyBadge({ shortcutKey }) {
  const formatted = formatShortcut(shortcutKey);

  // For two-key sequences like "g+h", show as two separate badges with "then"
  if (!shortcutKey.includes('cmd') &&
      !shortcutKey.includes('ctrl') &&
      !shortcutKey.includes('alt') &&
      !shortcutKey.includes('shift') &&
      !shortcutKey.includes('meta') &&
      shortcutKey.includes('+')) {
    const parts = shortcutKey.split('+');
    return (
      <span className="inline-flex items-center gap-1">
        <kbd className="
          inline-flex items-center justify-center
          min-w-[24px] h-6 px-1.5
          rounded-md
          bg-white/80 dark:bg-white/10 backdrop-blur-md
          border border-slate-200/50 dark:border-white/15
          text-[11px] font-semibold
          text-slate-600 dark:text-zinc-300
          shadow-[0_2px_4px_rgba(0,0,0,0.05)]
        ">
          {parts[0].toUpperCase()}
        </kbd>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">then</span>
        <kbd className="
          inline-flex items-center justify-center
          min-w-[24px] h-6 px-1.5
          rounded-md
          bg-white/80 dark:bg-white/10 backdrop-blur-md
          border border-slate-200/50 dark:border-white/15
          text-[11px] font-semibold
          text-slate-600 dark:text-zinc-300
          shadow-[0_2px_4px_rgba(0,0,0,0.05)]
        ">
          {parts[1].toUpperCase()}
        </kbd>
      </span>
    );
  }

  // For modifier combos, split formatted string into individual keys
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const separator = isMac ? '' : '+';
  const keys = separator ? formatted.split(separator) : formatted.split('');

  // Group modifier symbols together on Mac
  if (isMac) {
    // Formatted string on Mac is like "⌘⇧F" — split into chars
    const chars = [...formatted];
    return (
      <span className="inline-flex items-center gap-0.5">
        {chars.map((char, i) => (
          <kbd
            key={i}
            className="
              inline-flex items-center justify-center
              min-w-[24px] h-6 px-1.5
              rounded-md
              bg-white/80 dark:bg-white/10 backdrop-blur-md
              border border-slate-200/50 dark:border-white/15
              text-[11px] font-semibold
              text-slate-600 dark:text-zinc-300
              shadow-[0_2px_4px_rgba(0,0,0,0.05)]
            "
          >
            {char}
          </kbd>
        ))}
      </span>
    );
  }

  // Windows/Linux: split by +
  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.filter(Boolean).map((key, i) => (
        <kbd
          key={i}
          className="
            inline-flex items-center justify-center
            min-w-[24px] h-6 px-1.5
            rounded-md
            bg-white/80 dark:bg-white/10 backdrop-blur-md
            border border-slate-200/50 dark:border-white/15
            text-[11px] font-semibold
            text-slate-600 dark:text-zinc-300
            shadow-[0_2px_4px_rgba(0,0,0,0.05)]
          "
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function ShortcutGuide() {
  const { isGuideOpen, closeGuide } = useShortcutContext();

  // Close on Escape
  useEffect(() => {
    if (!isGuideOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeGuide();
      }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [isGuideOpen, closeGuide]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isGuideOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isGuideOpen]);

  // Get shortcuts grouped by category
  const categories = useMemo(() => getShortcutsByCategory(), []);

  if (!isGuideOpen) return null;

  return (
    <>
      {/* Premium Glass Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={closeGuide}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="
            w-full max-w-3xl max-h-[80vh]
            pointer-events-auto
            rounded-3xl overflow-hidden
            bg-white/90 dark:bg-[#1f1f23]/90 backdrop-blur-2xl
            border border-slate-200/50 dark:border-white/10
            shadow-[0_20px_40px_rgba(0,0,0,0.1),_0_0_0_1px_rgba(139,92,246,0.05)] 
            dark:shadow-[0_20px_40px_rgba(0,0,0,0.3),_0_0_0_1px_rgba(139,92,246,0.1)]
            animate-in fade-in slide-in-from-bottom-8 duration-300
            flex flex-col
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200/50 dark:border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-500/20 dark:to-violet-500/5 flex items-center justify-center shadow-sm border border-violet-200/50 dark:border-violet-500/20">
                <Keyboard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  Navigate ShareSync at the speed of thought
                </p>
              </div>
            </div>

            <button
              onClick={closeGuide}
              className="p-2.5 rounded-xl bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              {Object.entries(categories).map(([catKey, category]) => (
                <div key={catKey}>
                  {/* Category label */}
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                      {category.label}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-violet-200/50 to-transparent dark:from-violet-500/20" />
                  </div>

                  {/* Shortcuts list */}
                  <div className="space-y-1.5">
                    {category.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.action}
                        className="
                          flex items-center justify-between
                          py-2.5 px-3 -mx-3
                          rounded-xl
                          hover:bg-slate-100/50 dark:hover:bg-white/[0.04]
                          transition-colors group
                        "
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-700 dark:text-zinc-200 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                            {shortcut.label}
                          </span>
                          {shortcut.description && (
                            <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 ml-2 hidden lg:inline">
                              {shortcut.description}
                            </span>
                          )}
                        </div>

                        <div className="ml-4 flex-shrink-0">
                          <KeyBadge shortcutKey={shortcut.key} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50/80 dark:bg-black/20 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              Press <KeyBadge shortcutKey="shift+?" /> anytime to show this guide
            </p>
            <button
              onClick={closeGuide}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md shadow-violet-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
