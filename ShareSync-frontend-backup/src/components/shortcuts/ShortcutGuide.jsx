// src/components/shortcuts/ShortcutGuide.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.4: Keyboard shortcuts reference modal
// Opened by pressing ? key. Shows all shortcuts in a categorized grid.
// Reads from config/shortcuts.js (single source of truth).
// Uses the ShortcutProvider context for open/close state.
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
          bg-slate-100 dark:bg-white/10
          border border-slate-200 dark:border-white/15
          text-[11px] font-semibold
          text-slate-600 dark:text-zinc-300
          shadow-sm
        ">
          {parts[0].toUpperCase()}
        </kbd>
        <span className="text-[10px] text-slate-400 dark:text-zinc-600">then</span>
        <kbd className="
          inline-flex items-center justify-center
          min-w-[24px] h-6 px-1.5
          rounded-md
          bg-slate-100 dark:bg-white/10
          border border-slate-200 dark:border-white/15
          text-[11px] font-semibold
          text-slate-600 dark:text-zinc-300
          shadow-sm
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
              bg-slate-100 dark:bg-white/10
              border border-slate-200 dark:border-white/15
              text-[11px] font-semibold
              text-slate-600 dark:text-zinc-300
              shadow-sm
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
            bg-slate-100 dark:bg-white/10
            border border-slate-200 dark:border-white/15
            text-[11px] font-semibold
            text-slate-600 dark:text-zinc-300
            shadow-sm
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={closeGuide}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="
            w-full max-w-3xl max-h-[80vh]
            pointer-events-auto
            rounded-2xl overflow-hidden
            bg-white dark:bg-[#1a1a1e]
            border border-slate-200 dark:border-white/10
            shadow-2xl shadow-black/20
            animate-in fade-in slide-in-from-bottom-4 duration-200
            flex flex-col
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                <Keyboard className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                  Keyboard Shortcuts
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  Navigate ShareSync at the speed of thought
                </p>
              </div>
            </div>

            <button
              onClick={closeGuide}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(categories).map(([catKey, category]) => (
                <div key={catKey}>
                  {/* Category label */}
                  <h3 className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                    {category.label}
                  </h3>

                  {/* Shortcuts list */}
                  <div className="space-y-1">
                    {category.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.action}
                        className="
                          flex items-center justify-between
                          py-2 px-3 -mx-3
                          rounded-lg
                          hover:bg-slate-50 dark:hover:bg-white/[0.03]
                          transition-colors
                        "
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-slate-700 dark:text-zinc-200">
                            {shortcut.label}
                          </span>
                          {shortcut.description && (
                            <span className="text-xs text-slate-400 dark:text-zinc-600 ml-2 hidden lg:inline">
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
          <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Press <KeyBadge shortcutKey="?" /> anytime to show this guide
            </p>
            <button
              onClick={closeGuide}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
