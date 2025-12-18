/**
 * CursorContext.jsx - TEMPORARILY DISABLED
 * Missing Zustand dependencies - returning no-op context
 */

import React, { createContext, useContext } from 'react';

const CursorContext = createContext(null);

export const useCursorContext = () => {
  // ⚠️ RETURN MOCK DATA INSTEAD OF THROWING ERROR
  return {
    isConnected: false,
    socket: null,
    cursors: [],
    cursorsMap: new Map(),
    ownCursor: null,
    currentProject: null,
    joinProject: () => {}, // No-op
    leaveProject: () => {}, // No-op
    updateCursorPosition: () => {}, // No-op
    sendFlash: () => {}, // No-op
    focusTogether: () => {}, // No-op
    sendProximity: () => {}, // No-op
    sendHeartbeat: () => {}, // No-op
    settings: {},
    spatialIndex: { 
      update: () => {}, 
      query: () => [], 
      remove: () => {}, 
      clear: () => {} 
    }
  };
};

// Dummy provider that does nothing
export function CursorProvider({ children }) {
  return (
    <CursorContext.Provider value={{}}>
      {children}
    </CursorContext.Provider>
  );
}

export default CursorContext;
