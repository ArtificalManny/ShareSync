// /src/hooks/useCommandPalette.js
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  /**
   * CommandPaletteProvider
   * - Manages isOpen state and global ⌘K / Ctrl-K listener.
   * - Disables page scroll while open for better focus.
   * - Exposes { isOpen, open, close, toggle } via useCommandPalette().
   */
  
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
  
    // Body scroll lock while open
    useEffect(() => {
      const prev = document.body.style.overflow;
      if (isOpen) document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }, [isOpen]);
  
    // Global ⌘K / Ctrl-K + ESC
    useEffect(() => {
      const onKey = (e) => {
        if (e.isComposing) return;
        const isK = e.key?.toLowerCase?.() === "k";
        const shortcut = isK && (e.metaKey || e.ctrlKey) && !e.altKey;
        if (!shortcut) {
          if (e.key === "Escape" && isOpen) {
            e.preventDefault();
            close();
          }
          return;
        }
        e.preventDefault();
        toggle();
      };
  
      window.addEventListener("keydown", onKey, { capture: true });
      return () => window.removeEventListener("keydown", onKey, { capture: true });
    }, [isOpen, toggle, close]);
  
    const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
  
    // ⬇️ no JSX so .js is safe
    return React.createElement(Ctx.Provider, { value }, children);
  }
  
  export function useCommandPalette() {
    return useContext(Ctx);
  }  