// src/hooks/useShortcutBindings.jsx
import { useEffect } from 'react';

/**
 * A centralized hook to manage contextual keyboard shortcuts.
 * * @param {Object} bindings - Map of keys to callbacks (e.g., { 'e': handleEdit, 'space': handleToggle })
 * @param {boolean} isActive - Whether the shortcuts should currently listen (e.g., is the task hovered?)
 */
export function useShortcutBindings(bindings, isActive = true) {
  useEffect(() => {
    // If the component/element isn't active (hovered/focused), don't listen
    if (!isActive || !bindings) return;

    const handleKeyDown = (e) => {
      // 🚨 CRITICAL: Ignore if the user is typing inside an input, textarea, or composing text
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable ||
        e.isComposing
      ) {
        return;
      }

      // Normalize the key press (Spacebar maps to 'space', everything else to lowercase)
      const pressedKey = e.code === 'Space' ? 'space' : e.key.toLowerCase();
      
      // Capture modifier combinations (e.g., 'cmd+e', 'shift+space')
      const modifiers = [];
      if (e.metaKey || e.ctrlKey) modifiers.push('cmd');
      if (e.shiftKey) modifiers.push('shift');
      if (e.altKey) modifiers.push('alt');
      
      const fullCombo = modifiers.length > 0 ? [...modifiers, pressedKey].join('+') : pressedKey;

      // Check if either the exact combo or the single key matches our bindings
      const callback = bindings[fullCombo] || bindings[pressedKey];

      if (callback && typeof callback === 'function') {
        e.preventDefault();
        e.stopPropagation();
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindings, isActive]);
}
