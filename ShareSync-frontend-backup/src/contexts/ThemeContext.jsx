// src/contexts/ThemeContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL THEME PROVIDER - Phase 4: Signature Dark Mode
// Manages the transition between Light (Warm/Gallery) and Dark (Linear/Focus).
// Injecting `data-theme` allows CSS variables to dynamically swap globally.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. Check local storage, fallback to OS system preferences on first load
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ss.theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 2. The Magic: Inject data-theme and class="dark" into the HTML root element
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark'); // Triggers CSS Token Swaps
      localStorage.setItem('ss.theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('ss.theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
