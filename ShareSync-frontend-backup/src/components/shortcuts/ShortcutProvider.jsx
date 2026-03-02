// src/components/shortcuts/ShortcutProvider.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.4: Global shortcut provider
//
// Registers all shortcuts from config/shortcuts.js into the existing
// useKeyboardShortcuts system on mount. Dispatches window events that
// any component can listen for. Does NOT replace or conflict with the
// existing CommandPaletteProvider or useCommandPalette — it works alongside.
//
// Mount in App.jsx:
//   <ShortcutProvider>
//     ...children...
//   </ShortcutProvider>
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerShortcut } from '../../hooks/useKeyboardShortcuts';
import { SHORTCUTS, getShortcutsByCategory } from '../../config/shortcuts';

// ── Context ──────────────────────────────────────────────────────────────
const ShortcutContext = createContext({
  shortcutsEnabled: true,
  setShortcutsEnabled: () => {},
  isGuideOpen: false,
  openGuide: () => {},
  closeGuide: () => {},
});

export function useShortcutContext() {
  return useContext(ShortcutContext);
}

// ── Two-key sequence handler ─────────────────────────────────────────────
// Shortcuts like "g+h" mean: press G, then within 800ms press H
function isTwoKeySequence(key) {
  return key.includes('+') &&
    !key.includes('cmd') &&
    !key.includes('ctrl') &&
    !key.includes('alt') &&
    !key.includes('shift') &&
    !key.includes('meta');
}

export default function ShortcutProvider({ children }) {
  const navigate = useNavigate();
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const unregistersRef = useRef([]);

  // Track pending first key for two-key sequences
  const pendingKeyRef = useRef(null);
  const pendingTimerRef = useRef(null);

  const openGuide = useCallback(() => setIsGuideOpen(true), []);
  const closeGuide = useCallback(() => setIsGuideOpen(false), []);

  // ── Action dispatcher ──────────────────────────────────────────────
  // Maps action strings to actual behavior.
  // Components can also listen for 'shortcut-action' window events.
  const dispatchAction = useCallback((action, event) => {
    // Fire a generic window event that any component can listen for
    try {
      window.dispatchEvent(new CustomEvent('shortcut-action', {
        detail: { action, event },
      }));
    } catch { /* non-fatal */ }

    // Handle navigation actions directly
    switch (action) {
      // Navigation
      case 'NAV_HOME':       navigate('/home'); break;
      case 'NAV_PROJECTS':   navigate('/projects'); break;
      case 'NAV_ARENA':      navigate('/arena'); break;
      case 'NAV_SETTINGS':   navigate('/settings'); break;
      case 'NAV_PROFILE':    navigate('/me'); break;
      case 'NAV_MESSAGES':   navigate('/messages'); break;

      // These are handled by the window event — components listen for them
      // e.g., QuickAddModal listens for QUICK_ADD_OPEN
      // CommandPalette listens for COMMAND_PALETTE_OPEN (already has its own Cmd+K)
      // ShortcutGuide listens for SHORTCUT_GUIDE_OPEN
      case 'SHORTCUT_GUIDE_OPEN':
        openGuide();
        break;

      // All other actions → just the window event is enough
      default:
        break;
    }
  }, [navigate, openGuide]);

  // ── Register all shortcuts on mount ────────────────────────────────
  useEffect(() => {
    // Clean up previous registrations
    unregistersRef.current.forEach((fn) => fn());
    unregistersRef.current = [];

    // Separate single-key from two-key sequences
    const singleKey = [];
    const twoKey = [];

    SHORTCUTS.forEach((shortcut) => {
      if (isTwoKeySequence(shortcut.key)) {
        twoKey.push(shortcut);
      } else {
        singleKey.push(shortcut);
      }
    });

    // Register single-key shortcuts normally
    singleKey.forEach((shortcut) => {
      // Skip cmd+k — already handled by existing CommandPaletteProvider
      if (shortcut.action === 'COMMAND_PALETTE_OPEN') return;
      // Skip escape — handled by individual modals
      if (shortcut.action === 'CLOSE_MODAL') return;

      const unregister = registerShortcut(
        `sp_${shortcut.action}`,
        shortcut.key,
        (e) => {
          if (!shortcutsEnabled) return;
          dispatchAction(shortcut.action, e);
        },
        {
          allowInInput: shortcut.allowInInput || false,
          description: shortcut.label,
          category: shortcut.category || 'General',
          hidden: shortcut.hidden || false,
        }
      );
      unregistersRef.current.push(unregister);
    });

    // Register two-key sequences via a global listener
    // e.g., "g+h" = press G, then within 800ms press H
    if (twoKey.length > 0) {
      const handler = (e) => {
        if (!shortcutsEnabled) return;

        // Don't fire in inputs
        const target = e.target;
        const isInput = target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (isInput) return;

        // Don't fire with modifier keys
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        const key = e.key.toLowerCase();

        if (pendingKeyRef.current) {
          // We have a pending first key — check for match
          const combo = `${pendingKeyRef.current}+${key}`;
          const match = twoKey.find((s) => s.key === combo);

          // Clear pending state
          clearTimeout(pendingTimerRef.current);
          pendingKeyRef.current = null;

          if (match) {
            e.preventDefault();
            dispatchAction(match.action, e);
            return;
          }
        }

        // Check if this key is a valid first key in any sequence
        const isFirstKey = twoKey.some((s) => s.key.startsWith(key + '+'));
        if (isFirstKey) {
          pendingKeyRef.current = key;
          // Clear after 800ms
          clearTimeout(pendingTimerRef.current);
          pendingTimerRef.current = setTimeout(() => {
            pendingKeyRef.current = null;
          }, 800);
        }
      };

      window.addEventListener('keydown', handler);
      unregistersRef.current.push(() => window.removeEventListener('keydown', handler));
    }

    return () => {
      unregistersRef.current.forEach((fn) => fn());
      unregistersRef.current = [];
      clearTimeout(pendingTimerRef.current);
    };
  }, [shortcutsEnabled, dispatchAction]);

  // ── Context value ──────────────────────────────────────────────────
  const value = useMemo(() => ({
    shortcutsEnabled,
    setShortcutsEnabled,
    isGuideOpen,
    openGuide,
    closeGuide,
  }), [shortcutsEnabled, isGuideOpen, openGuide, closeGuide]);

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}
