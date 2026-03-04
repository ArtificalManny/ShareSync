// /src/hooks/useCommandPalette.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 6.1: UNIFIED COMMAND PALETTE HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const Ctx = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export function CommandPaletteProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Global Keyboard Listener
  useEffect(() => {
    const onKey = (e) => {
      // 1. Avoid triggering during IME composition (important for international users)
      if (e.isComposing) return;

      // 2. Check for Cmd+K or Ctrl+K
      const isK = e.key?.toLowerCase?.() === "k";
      const shortcut = isK && (e.metaKey || e.ctrlKey) && !e.altKey;

      if (shortcut) {
        e.preventDefault();
        toggle();
        return;
      }

      // 3. Close on Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [isOpen, toggle, close]);

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useCommandPalette() {
  const context = useContext(Ctx);
  if (!context) {
    console.error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}
