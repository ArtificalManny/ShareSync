// src/hooks/useKeyboardShortcuts.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Global Keyboard Shortcuts System (FIXED)
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Keyboard shortcut registry and handler
 */
const shortcutRegistry = new Map();
const listeners = new Set();

// Notify all listeners of registry changes
function notifyListeners() {
  listeners.forEach(fn => fn());
}

/**
 * Parse a shortcut string into components
 * e.g., "cmd+k" -> { key: 'k', cmd: true, ctrl: false, alt: false, shift: false }
 */
function parseShortcut(shortcut) {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    key,
    cmd: parts.includes('cmd') || parts.includes('meta'),
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt') || parts.includes('option'),
    shift: parts.includes('shift'),
  };
}

/**
 * Check if an event matches a parsed shortcut
 */
function eventMatchesShortcut(event, parsed) {
  // openshare-apple-shortcut-platform-v1
  //
  // "cmd" means the Apple Command/Meta key on every Apple platform,
  // including iPhone/iPad WebViews — not only macOS.
  //
  // On Windows/Linux, "cmd" remains an alias for Ctrl so the same
  // shortcut definitions work cross-platform.
  const platform = String(navigator.platform || '');
  const userAgent = String(navigator.userAgent || '');

  const isApplePlatform =
    /Mac|iPhone|iPad|iPod/i.test(platform) ||
    /iPhone|iPad|iPod/i.test(userAgent);

  const expectsMeta = parsed.cmd && isApplePlatform;
  const expectsCtrl =
    parsed.ctrl ||
    (parsed.cmd && !isApplePlatform);

  return (
    String(event.key || '').toLowerCase() === parsed.key &&
    event.metaKey === expectsMeta &&
    event.ctrlKey === expectsCtrl &&
    event.altKey === parsed.alt &&
    event.shiftKey === parsed.shift
  );
}

/**
 * Global keyboard event handler
 */
const EDITABLE_SHORTCUT_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
].join(', ');

function isEditableShortcutTarget(node) {
  if (!node || typeof node.matches !== 'function') {
    return false;
  }

  return (
    node.matches(EDITABLE_SHORTCUT_SELECTOR) ||
    Boolean(node.closest?.(EDITABLE_SHORTCUT_SELECTOR))
  );
}

function isEditingDuringShortcutEvent(event) {
  // IME/composition input must never be interpreted as an app shortcut.
  if (event.isComposing) {
    return true;
  }

  const candidates = [
    event.target,
    document.activeElement,
  ];

  if (typeof event.composedPath === 'function') {
    candidates.push(...event.composedPath());
  }

  return candidates.some(isEditableShortcutTarget);
}

function globalKeyHandler(event) {
  // openshare-global-shortcuts-ignore-editing-v1
  //
  // Capacitor/WebKit may not always expose the focused form control as
  // event.target. Check the event origin, active element, and composed path
  // before allowing any normal global shortcut to run.
  const isEditing = isEditingDuringShortcutEvent(event);

  for (const [id, { shortcut, handler, allowInInput }] of shortcutRegistry) {
    if (isEditing && !allowInInput) {
      continue;
    }

    const parsed = parseShortcut(shortcut);

    if (eventMatchesShortcut(event, parsed)) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
      return;
    }
  }
}

// Set up global listener once
let globalListenerAttached = false;
function ensureGlobalListener() {
  if (!globalListenerAttached) {
    window.addEventListener('keydown', globalKeyHandler, true);
    globalListenerAttached = true;
  }
}

/**
 * Register a keyboard shortcut
 */
export function registerShortcut(id, shortcut, handler, options = {}) {
  ensureGlobalListener();
  
  shortcutRegistry.set(id, {
    shortcut,
    handler,
    allowInInput: options.allowInInput || false,
    description: options.description || '',
    category: options.category || 'General',
    hidden: options.hidden || false,
  });
  
  notifyListeners();
  
  // Return unregister function
  return () => {
    shortcutRegistry.delete(id);
    notifyListeners();
  };
}

/**
 * Get all registered shortcuts
 */
export function getAllShortcuts() {
  const shortcuts = [];
  for (const [id, config] of shortcutRegistry) {
    if (!config.hidden) {
      shortcuts.push({ id, ...config });
    }
  }
  return shortcuts;
}

/**
 * Hook for registering shortcuts in components
 */
export function useKeyboardShortcut(shortcut, handler, options = {}) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const id = options.id || `shortcut_${shortcut}_${Math.random().toString(36).slice(2)}`;
    
    const unregister = registerShortcut(
      id,
      shortcut,
      (e) => handlerRef.current(e),
      options
    );

    return unregister;
  }, [shortcut, options.id, options.allowInInput, options.description, options.category]);
}

/**
 * Hook to get all shortcuts and re-render on changes
 * FIXED: Using useState instead of incorrectly using useCallback
 */
export function useAllShortcuts() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const forceUpdate = () => setTick(t => t + 1);
    listeners.add(forceUpdate);
    return () => listeners.delete(forceUpdate);
  }, []);

  return getAllShortcuts();
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return shortcut
    .split('+')
    .map(part => {
      const p = part.toLowerCase();
      if (p === 'cmd' || p === 'meta') return isMac ? '⌘' : 'Ctrl';
      if (p === 'ctrl') return isMac ? '⌃' : 'Ctrl';
      if (p === 'alt' || p === 'option') return isMac ? '⌥' : 'Alt';
      if (p === 'shift') return '⇧';
      if (p === 'enter') return '↵';
      if (p === 'escape' || p === 'esc') return 'Esc';
      if (p === 'backspace') return '⌫';
      if (p === 'delete') return '⌦';
      if (p === 'arrowup') return '↑';
      if (p === 'arrowdown') return '↓';
      if (p === 'arrowleft') return '←';
      if (p === 'arrowright') return '→';
      return part.toUpperCase();
    })
    .join(isMac ? '' : '+');
}

export default {
  useKeyboardShortcut,
  useAllShortcuts,
  registerShortcut,
  getAllShortcuts,
  formatShortcut,
};
