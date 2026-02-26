// src/contexts/ThemeContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL THEME PROVIDER
// Manages the OLED/White iPhone aesthetic across the entire app globally.
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

  // 2. The Magic: Inject class="dark" directly into the HTML root element
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('ss.theme', 'dark');
    } else {
      root.classList.remove('dark');
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
