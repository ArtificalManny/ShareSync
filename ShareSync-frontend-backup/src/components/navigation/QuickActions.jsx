// src/components/navigation/QuickActions.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Quick Action Buttons (Floating FAB style)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Plus, Rocket, CheckCircle2, Target, MessageSquare, 
  X, Command, Zap
} from 'lucide-react';
import { useKeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';

const QUICK_ACTIONS = [
  {
    id: 'ship',
    label: 'Ship Update',
    icon: Rocket,
    shortcut: 'cmd+shift+s',
    color: 'bg-brand hover:bg-brand-600',
    primary: true,
  },
  {
    id: 'task',
    label: 'Add Task',
    icon: CheckCircle2,
    shortcut: 'cmd+shift+t',
    color: 'bg-success hover:bg-success/90',
  },
  {
    id: 'objective',
    label: 'New Objective',
    icon: Target,
    shortcut: null,
    color: 'bg-cyan-500 hover:bg-cyan-600',
  },
  {
    id: 'note',
    label: 'Quick Note',
    icon: MessageSquare,
    shortcut: null,
    color: 'bg-warning hover:bg-warning/90',
  },
];

export default function QuickActions({ onAction }) {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut to toggle
  useKeyboardShortcut('cmd+.', () => setIsOpen(o => !o), {
    id: 'toggle-quick-actions',
    description: 'Toggle quick actions',
    category: 'General',
  });

  const handleAction = (action) => {
    setIsOpen(false);
    onAction?.(action);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Action buttons (expanded) */}
      <div className={`
        absolute bottom-full right-0 mb-3
        flex flex-col-reverse gap-3
        transition-all duration-300
        ${isOpen 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}>
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <div 
              key={action.id}
              className="flex items-center gap-3 justify-end"
              style={{ 
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              {/* Label */}
              <div className="
                px-3 py-2 rounded-lg
                bg-surface-1 border border-white/[0.1]
                shadow-lg
                opacity-0 group-hover:opacity-100
                transition-opacity
              ">
                <span className="text-sm text-text-primary whitespace-nowrap">
                  {action.label}
                </span>
                {action.shortcut && (
                  <span className="ml-2 text-xs text-text-tertiary">
                    {formatShortcut(action.shortcut)}
                  </span>
                )}
              </div>

              {/* Button */}
              <button
                onClick={() => handleAction(action.id)}
                className={`
                  group w-12 h-12 rounded-full
                  flex items-center justify-center
                  shadow-lg shadow-black/30
                  transition-all duration-200
                  hover:scale-110
                  ${action.color} text-white
                `}
              >
                <Icon className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full
          flex items-center justify-center
          bg-brand text-white
          shadow-lg shadow-brand/30
          transition-all duration-300
          hover:shadow-xl hover:shadow-brand/40
          ${isOpen ? 'rotate-45 bg-surface-2 text-text-primary' : ''}
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Hint */}
      {!isOpen && (
        <div className="
          absolute -top-1 -left-1
          px-1.5 py-0.5 rounded
          bg-surface-1 border border-white/[0.1]
          shadow-lg
          opacity-0 hover:opacity-100
          transition-opacity pointer-events-none
        ">
          <span className="text-[10px] text-text-tertiary">
            {formatShortcut('cmd+.')}
          </span>
        </div>
      )}
    </div>
  );
}
