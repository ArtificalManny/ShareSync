// /src/hooks/useCommandPalette.js
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Home, Folder, Search, Settings, User, Plus } from "lucide-react";

/**
 * CommandPaletteProvider
 */
const Ctx = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const commands = [
  { name: "Go to Home", icon: Home, to: "/home", shortcut: "⌘H" },
  { name: "Go to Projects", icon: Folder, to: "/projects", shortcut: "⌘P" },
  { name: "Search", icon: Search, action: () => document.getElementById("search")?.focus(), shortcut: "⌘K" },
  { name: "Settings", icon: Settings, to: "/settings", shortcut: "⌘," },
  { name: "Profile", icon: User, to: "/profile", shortcut: "⌘U" },
  { name: "Create Project", icon: Plus, action: () => window.dispatchEvent(new CustomEvent("open-create-project")), shortcut: "⌘N" },
];

export function CommandPaletteProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

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

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useCommandPalette() {
  return useContext(Ctx);
}