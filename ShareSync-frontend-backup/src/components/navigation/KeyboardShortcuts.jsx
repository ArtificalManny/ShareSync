// src/components/navigation/KeyboardShortcuts.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Keyboard Shortcuts Help Modal
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { useAllShortcuts, formatShortcut, useKeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

export default function KeyboardShortcuts({ isOpen, onClose }) {
  const shortcuts = useAllShortcuts();

  // Register shortcut to close
  useKeyboardShortcut('escape', () => isOpen && onClose(), {
    id: 'close-shortcuts-modal',
    hidden: true,
  });

  // Group by category
  const grouped = useMemo(() => {
    const groups = {};
    shortcuts.forEach(s => {
      const cat = s.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [shortcuts]);

  // Default shortcuts that are always shown
  const defaultShortcuts = {
    'General': [
      { shortcut: 'cmd+k', description: 'Open command palette' },
      { shortcut: 'cmd+/', description: 'Show keyboard shortcuts' },
      { shortcut: 'escape', description: 'Close modal / Cancel' },
    ],
    'Navigation': [
      { shortcut: 'cmd+shift+h', description: 'Go to Home' },
      { shortcut: 'cmd+shift+p', description: 'Go to Projects' },
      { shortcut: 'cmd+shift+i', description: 'Go to Profile' },
      { shortcut: 'cmd+,', description: 'Go to Settings' },
    ],
    'Actions': [
      { shortcut: 'cmd+shift+s', description: 'Ship Update' },
      { shortcut: 'cmd+shift+t', description: 'Quick Add Task' },
      { shortcut: 'cmd+shift+f', description: 'Start Focus Session' },
      { shortcut: 'cmd+enter', description: 'Submit / Confirm' },
    ],
    'Editor': [
      { shortcut: 'cmd+b', description: 'Bold text' },
      { shortcut: 'cmd+i', description: 'Italic text' },
      { shortcut: 'cmd+shift+x', description: 'Strikethrough' },
      { shortcut: 'cmd+shift+c', description: 'Code block' },
    ],
  };

  if (!isOpen) return null;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative w-full max-w-3xl max-h-[80vh]
        bg-surface-1 border border-white/[0.08] rounded-2xl
        overflow-hidden
        animate-in zoom-in-95 duration-200
      ">
        {/* Header */}
        <div className="
          flex items-center justify-between
          px-6 py-4 border-b border-white/[0.06]
        ">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <Keyboard className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-text-tertiary">
                {isMac ? '⌘ = Command key' : 'Ctrl = Control key'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(defaultShortcuts).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <ShortcutRow 
                      key={i} 
                      shortcut={item.shortcut} 
                      description={item.description} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pro tip */}
          <div className="
            mt-8 p-4 rounded-xl
            bg-brand/5 border border-brand/10
          ">
            <div className="flex items-start gap-3">
              <Command className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Pro tip: Use the Command Palette
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/[0.06] text-text-secondary">
                    {formatShortcut('cmd+k')}
                  </kbd> to quickly search for any action, navigate to pages, or access settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut, description }) {
  const formatted = formatShortcut(shortcut);
  
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-secondary">{description}</span>
      <div className="flex items-center gap-1">
        {formatted.split('').map((char, i) => (
          <kbd 
            key={i}
            className="
              min-w-[24px] h-6 px-1.5
              flex items-center justify-center
              rounded bg-surface-2 border border-white/[0.08]
              text-xs text-text-primary font-medium
            "
          >
            {char}
          </kbd>
        ))}
      </div>
    </div>
  );
}
