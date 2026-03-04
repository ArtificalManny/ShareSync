// src/hooks/useQuickAdd.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const QuickAddContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export function QuickAddProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if composing (international keyboards) or typing inside an input/textarea
      if (
        e.isComposing ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Check for 'q' or 'Q' without modifier keys
      if (e.key.toLowerCase() === 'q' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        open();
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, open, close]);

  return (
    <QuickAddContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </QuickAddContext.Provider>
  );
}

export const useQuickAdd = () => useContext(QuickAddContext);
