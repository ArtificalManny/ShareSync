// src/hooks/useContextMenu.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ContextMenuContext = createContext({
  isOpen: false,
  x: 0,
  y: 0,
  items: [],
  data: null,
  showMenu: () => {},
  closeMenu: () => {},
});

export function ContextMenuProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
    data: null,
  });

  // Attach this to any element's onContextMenu event
  const showMenu = useCallback((e, items, data = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close the quick-add or command palette if they happen to be open
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    setState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      items,
      data,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, []);

  // Global close listeners
  useEffect(() => {
    if (!state.isOpen) return;

    const handleOutsideClick = () => closeMenu();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    const handleScroll = () => closeMenu();

    // Small delay prevents immediate closure from the event that opened it
    const timeout = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true); // capture phase for all scrolls
    }, 10);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [state.isOpen, closeMenu]);

  return (
    <ContextMenuContext.Provider value={{ ...state, showMenu, closeMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export const useContextMenu = () => useContext(ContextMenuContext);
