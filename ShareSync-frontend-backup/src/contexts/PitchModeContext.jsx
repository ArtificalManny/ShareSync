// src/contexts/PitchModeContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: DEMO-READY DATA & PITCH MODE
// A stealthy context to enable a flawless, error-free presentation environment.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from 'react';

const PitchModeContext = createContext();

export const usePitchMode = () => {
  const context = useContext(PitchModeContext);
  if (!context) {
    throw new Error("usePitchMode must be used within a PitchModeProvider");
  }
  return context;
};

export const PitchModeProvider = ({ children }) => {
  // Initialize from localStorage so it survives page reloads during a pitch
  const [isPitchMode, setIsPitchMode] = useState(() => {
    try {
      return localStorage.getItem('ss.pitchMode') === 'true';
    } catch {
      return false;
    }
  });

  const togglePitchMode = () => {
    setIsPitchMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ss.pitchMode', next.toString());
      } catch (e) {
        console.warn("Could not save Pitch Mode state to localStorage");
      }
      
      // Log for the developer
      if (next) {
        console.log('🎭 PITCH MODE ENABLED: Errors suppressed, demo data engaged.');
      } else {
        console.log('🎭 PITCH MODE DISABLED: Standard operation restored.');
      }
      
      return next;
    });
  };

  // Sync class to body for global CSS targeting
  useEffect(() => {
    if (isPitchMode) {
      document.body.classList.add('pitch-mode-active');
    } else {
      document.body.classList.remove('pitch-mode-active');
    }
  }, [isPitchMode]);

  return (
    <PitchModeContext.Provider value={{ isPitchMode, togglePitchMode }}>
      {children}
      
      {/* A nearly invisible 2px indicator in the bottom right corner.
        This lets the presenter know Pitch Mode is armed without the audience noticing. 
      */}
      {isPitchMode && (
        <div 
          className="fixed bottom-1 right-1 w-1 h-1 rounded-full bg-emerald-500 opacity-30 z-[9999] pointer-events-none" 
          title="Pitch Mode Active"
        />
      )}
    </PitchModeContext.Provider>
  );
};
