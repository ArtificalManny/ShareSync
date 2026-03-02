// src/components/tasks/ReminderDropdown.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.2: Reminder selector dropdown
// Options: "At due time", "15 min before", "1 hour before", "1 day before", Custom
// Saves reminder preference per task via onSelect callback
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, BellOff, Check, ChevronDown, Clock } from 'lucide-react';

const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder', icon: BellOff, offsetMs: null },
  { value: 'at_due', label: 'At due time', icon: Bell, offsetMs: 0 },
  { value: '15m', label: '15 minutes before', icon: Clock, offsetMs: 15 * 60 * 1000 },
  { value: '1h', label: '1 hour before', icon: Clock, offsetMs: 60 * 60 * 1000 },
  { value: '3h', label: '3 hours before', icon: Clock, offsetMs: 3 * 60 * 60 * 1000 },
  { value: '1d', label: '1 day before', icon: Clock, offsetMs: 24 * 60 * 60 * 1000 },
];

export default function ReminderDropdown({
  value = 'none',     // current reminder setting value
  dueDate = null,      // Date object or ISO string (for context display)
  onSelect,            // (option: { value, label, offsetMs }) => void
  disabled = false,
  size = 'sm',         // 'xs' | 'sm' | 'md'
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleSelect = useCallback((option) => {
    onSelect?.(option);
    setIsOpen(false);
    setShowCustom(false);
  }, [onSelect]);

  const handleCustomSubmit = useCallback(() => {
    const mins = parseInt(customMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    handleSelect({
      value: `custom_${mins}m`,
      label: `${mins} minutes before`,
      offsetMs: mins * 60 * 1000,
    });
    setCustomMinutes('');
  }, [customMinutes, handleSelect]);

  const selectedOption = REMINDER_OPTIONS.find((o) => o.value === value) || REMINDER_OPTIONS[0];
  const hasReminder = value !== 'none';

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-2.5 py-1.5 text-xs gap-1.5',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-flex ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center rounded-lg font-medium
          transition-all duration-150
          ${sizeClasses[size] || sizeClasses.sm}
          ${hasReminder
            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20'
            : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-zinc-500 border border-slate-200 dark:border-white/10 hover:text-violet-500 hover:border-violet-200 dark:hover:border-violet-500/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Bell className={`w-3 h-3 ${hasReminder ? 'text-violet-500' : ''}`} />
        <span>{selectedOption.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 mt-1 z-50
            w-56 py-1 rounded-xl
            bg-white dark:bg-zinc-800
            border border-slate-200 dark:border-white/10
            shadow-xl shadow-slate-900/10 dark:shadow-black/40
          "
        >
          {/* No due date warning */}
          {!dueDate && (
            <div className="px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-b border-slate-100 dark:border-white/5">
              Set a due date first to enable reminders
            </div>
          )}

          {/* Options */}
          {REMINDER_OPTIONS.map((option) => {
            const isActive = value === option.value;
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left
                  transition-colors
                  ${isActive
                    ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                    : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/5'
                  }
                `}
              >
                <OptionIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span className="flex-1">{option.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-violet-500" />}
              </button>
            );
          })}

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

          {/* Custom option */}
          {!showCustom ? (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              Custom...
            </button>
          ) : (
            <div className="px-3 py-2 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10080"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(); }}
                placeholder="Min"
                autoFocus
                className="
                  w-16 px-2 py-1 rounded-md text-xs
                  bg-slate-50 dark:bg-white/5
                  border border-slate-200 dark:border-white/10
                  text-slate-700 dark:text-zinc-200
                  outline-none focus:border-violet-300
                "
              />
              <span className="text-[11px] text-slate-400">minutes before</span>
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="ml-auto px-2 py-1 rounded-md text-[11px] font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                Set
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
